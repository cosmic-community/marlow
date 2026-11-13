const MESSAGE_JSON = '{"message": "..."}'
const WITH_ITEMS = '{"message": "...", "accept": ["items"]}'

// The server's Ask line shows only the message. Marlow also returns listing
// items, so the example a visiting agent copies asks for them.
export function withAcceptItems(card: string) {
  if (!card.includes(MESSAGE_JSON) || card.includes(WITH_ITEMS)) return card
  return card.replace(MESSAGE_JSON, WITH_ITEMS)
}
