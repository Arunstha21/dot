import { TextChannel, APIEmbed } from 'discord.js';
import { TicketDocument } from '@/lib/database/ticket';
import { Buffer } from 'buffer';

// Types for transcript data structures
interface TranscriptUser {
	id: string;
	name: string;
	tag: string;
	avatar: string;
	display: string;
}

interface TranscriptAttachment {
	url: string;
	name?: string;
	size: number;
	height: number | null;
	width: number | null;
	contentType: string | null;
}

interface TranscriptEmbed {
	title: string | null;
	description: string | null;
	fields: APIEmbed['fields'];
	color: number | null;
	footer?: string;
	timestamp: string | null;
}

interface TranscriptReply {
	author: string;
	content: string;
	id: string;
}

interface TranscriptMessage {
	id: string;
	content: string;
	timestamp: string;
	user_id: string;
	attachments: TranscriptAttachment[];
	embeds: TranscriptEmbed[];
	replyTo: TranscriptReply | null;
}

export async function createTranscriptHtml(channel: TextChannel): Promise<Buffer> {
  const messages = await channel.messages.fetch({ limit: 100 });
  const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const ticket = await TicketDocument.findOne({ channelId: channel.id });
  const ownerId = ticket?.userId || 'Unknown';
  const ownerUser = await channel.guild.members.fetch(ownerId).catch(() => null);
  const ownerTag = ownerUser ? `${ownerUser.user.globalName ?? ownerUser.user.username}#${ownerUser.user.discriminator}` : 'Unknown';

  const users: Record<string, TranscriptUser> = {};
  const messageLog: TranscriptMessage[] = [];

  for (const [, msg] of sorted) {
    const author = msg.author;
    const member = msg.member ?? await channel.guild.members.fetch(author.id).catch(() => null);
    const display = member?.user.globalName ?? member?.nickname ?? author.username;

    if (!users[author.id]) {
      users[author.id] = {
        id: author.id,
        name: author.username,
        tag: author.discriminator,
        avatar: author.displayAvatarURL({ extension: 'png', size: 128 }).split('?')[0],
        display
      };
    }

    // Include mentioned users
    for (const [id, mention] of msg.mentions.users) {
      if (!users[id]) {
        const member = await channel.guild.members.fetch(id).catch(() => null);
        users[id] = {
          id: mention.id,
          name: mention.username,
          tag: mention.discriminator,
          avatar: mention.displayAvatarURL({ extension: 'png', size: 128 }).split('?')[0],
          display: member?.user.globalName ?? member?.nickname ?? mention.username
        };
      }
    }

    const attachments = msg.attachments.map(att => ({
      url: att.url,
      name: att.name,
      size: att.size,
      height: att.height,
      width: att.width,
      contentType: att.contentType
    }));

    const embeds = msg.embeds?.map(e => ({
      title: e.title,
      description: e.description,
      fields: e.fields,
      color: e.color,
      footer: e.footer?.text,
      timestamp: e.timestamp
    })) || [];

    let replyTo = null;
    if (msg.reference?.messageId) {
      const referenced = await channel.messages.fetch(msg.reference.messageId).catch(() => null);
      if (referenced) {
        const refMember = referenced.member ?? await channel.guild.members.fetch(referenced.author.id).catch(() => null);
        const refDisplay = refMember?.user.globalName ?? refMember?.nickname ?? referenced.author.username;
        replyTo = {
          author: refDisplay,
          content: referenced.cleanContent.slice(0, 120),
          id: referenced.id
        };
      }
    }

    messageLog.push({
      id: msg.id,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      user_id: author.id,
      attachments,
      embeds,
      replyTo
    });
  }

  const encoded = {
    channel: Buffer.from(JSON.stringify({ name: channel.name, id: channel.id })).toString('base64'),
    server: Buffer.from(JSON.stringify({ name: channel.guild.name, id: channel.guild.id })).toString('base64'),
    messages: Buffer.from(JSON.stringify(messageLog)).toString('base64'),
    users: Buffer.from(JSON.stringify(users)).toString('base64')
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Transcript - #${channel.name}</title>
  <style>
    body { font-family: 'gg sans', 'Segoe UI', sans-serif; background: #313338; color: #ddd; padding: 20px; }
    .header, .info-embed { margin-bottom: 20px; }
    .info-embed {
      background: #2b2d31;
      border-left: 4px solid #5865f2;
      padding: 12px 16px;
      border-radius: 5px;
    }
    .embed-header { font-weight: bold; margin-bottom: 8px; font-size: 1.05em; }
    .embed-field { margin: 4px 0; font-size: 0.95em; }
    .message-box { display: flex; align-items: flex-start; margin-bottom: 18px; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; }
    .message-content { background: transparent; max-width: 700px; }
    .message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
    .author { font-weight: 600; color: #fff; font-size: 0.95em; }
    .timestamp { font-size: 0.75em; color: #999; }
    .message-body { font-size: 0.95em; white-space: pre-wrap; line-height: 1.4em; word-break: break-word; }
    .attachment { margin-top: 8px; }
    .attachment img { max-width: 100%; border-radius: 4px; }
    .embed {
      background: #2f3136;
      border-left: 4px solid #5865f2;
      padding: 10px;
      margin-top: 8px;
      border-radius: 4px;
    }
    .embed-title { font-weight: bold; color: #fff; margin-bottom: 4px; }
    .embed-description { color: #ccc; margin-bottom: 4px; }
    .embed-field { margin: 4px 0; }
    .mention {
      color: #00a8fc;
      background: rgba(0, 168, 252, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 500;
    }
    .reply-quote {
      background: #2e2f33;
      padding: 6px 10px;
      border-left: 3px solid #00a8fc;
      margin-bottom: 6px;
      border-radius: 4px;
      font-size: 0.85em;
      color: #ccc;
    }
    .reply-snippet {
      color: #bbb;
      font-style: italic;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Transcript for #${channel.name}</h2>
    <p><strong>Server:</strong> ${channel.guild.name} (${channel.guild.id})</p>
    <p><strong>Channel:</strong> #${channel.name} (${channel.id})</p>
    <p><strong>Total Messages:</strong> ${messageLog.length}</p>
  </div>
  <div class="info-embed">
    <div class="embed-header">🎫 Ticket Information</div>
    <div class="embed-field"><strong>Owner:</strong> ${ownerTag} (${ownerId})</div>
    <div class="embed-field"><strong>Created At:</strong> ${channel.createdAt.toLocaleString()}</div>
    <div class="embed-field"><strong>Transcript Generated:</strong> ${new Date().toLocaleString()}</div>
  </div>
  <div id="transcript"></div>
  <script>
    const channel = JSON.parse(atob("${encoded.channel}"));
    const server = JSON.parse(atob("${encoded.server}"));
    const messages = JSON.parse(atob("${encoded.messages}"));
    const users = JSON.parse(atob("${encoded.users}"));

    function parseMentions(content, users) {
      return content
        .replace(/<@!?(\d+)>/g, (_, id) => {
          const user = users[id];
          return user ? '<span class="mention">@' + user.display + '</span>' : '@unknown';
        })
        .replace(/<#(\\d+)>/g, (_, id) => '<span class="mention">#channel</span>')
        .replace(/<@&(\\d+)>/g, (_, id) => '<span class="mention">@role</span>');
    }

    const container = document.getElementById("transcript");
    messages.forEach(msg => {
      const user = users[msg.user_id];
      const div = document.createElement('div');
      div.className = 'message-box';
      const attachments = msg.attachments?.map(att => {
        if (att.contentType?.startsWith('image')) {
          return \`<div class="attachment"><img src="\${att.url}" alt="\${att.name}" /></div>\`;
        } else {
          return \`<div class="attachment"><a href="\${att.url}" target="_blank">\${att.name}</a> (\${att.size} bytes)</div>\`;
        }
      }).join('') || '';
      const embeds = msg.embeds?.map(e => {
        const fields = e.fields?.map(f => \`<div class="embed-field"><strong>\${f.name}</strong>: \${f.value}</div>\`).join('') || '';
        return \`
          <div class="embed" style="border-left-color: \${e.color ? '#' + e.color.toString(16).padStart(6, '0') : '#5865f2'};">
            \${e.title ? '<div class="embed-title">' + e.title + '</div>' : ''}
            \${e.description ? '<div class="embed-description">' + e.description + '</div>' : ''}
            \${fields}
            \${e.footer ? '<div class="embed-footer">' + e.footer + '</div>' : ''}
          </div>
        \`;
      }).join('') || '';
      const contentParsed = parseMentions(msg.content, users);
      const reply = msg.replyTo
        ? \`<div class="reply-quote"><strong>@\${msg.replyTo.author}</strong><div class="reply-snippet">\${msg.replyTo.content}</div></div>\`
        : '';
      div.innerHTML = \`
        <img class="avatar" src="\${user.avatar}" alt="\${user.name}">
        <div class="message-content">
          <div class="message-header">
            <span class="author">\${user.display}</span>
            <span class="timestamp">\${new Date(msg.timestamp).toLocaleString()}</span>
          </div>
          \${reply}
          <div class="message-body">\${contentParsed}</div>
          \${attachments}
          \${embeds}
        </div>
      \`;
      container.appendChild(div);
    });
  </script>
</body>
</html>
  `;

  await TicketDocument.findOneAndUpdate(
    { channelId: channel.id },
    { $set: { messages: messageLog } }
  );

  return Buffer.from(html, 'utf-8');
}