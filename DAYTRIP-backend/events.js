// Shared SSE broadcaster — keeps track of connected admin clients
const clients = new Set()

export const addAdminClient    = (res) => clients.add(res)
export const removeAdminClient = (res) => clients.delete(res)

export const broadcastAdmin = (event, data) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of clients) {
        try { res.write(payload) } catch { clients.delete(res) }
    }
}
