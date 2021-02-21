import { Client } from "@elastic/elasticsearch"

var esClient

function createESClient(input) {
    return new Client({
        nodes: input?.endpoint.split(",") ?? "http://localhost:9200",
        ...input
    })
}

export function getESClient(input) {
    if (!esClient) {
        console.log("[Audit Trail] Create new connection to Elasticsearch")
        esClient = createESClient(input)
    }
    return esClient
}

export async function elasticsearchInsert({
    indexName = 'audit-trail', 
    insertdata, 
    client
}) {
    try {
        const result = await client.index({
            index: indexName,
            op_type: "create",
            refresh: "false",
            body: insertdata
        })
        return result.body
    } catch (err) {
        console.log("[Audit Trail] elasticsearch insert error", err)
        return null
    }
}

export async function elasticsearchSearch({
    indexName = 'audit-trail',
    commitHashArray,
    size = 1, 
    sort = {
        time: "desc"
    },
    client
}) {
    try {
        const result = await client.search({
            index: indexName,
            size,
            sort,
            body: {
                query: {
                    match: {
                        commitHash: {
                            query: commitHashArray.join(" ")
                        }
                    }
                }
            }
        })
        return result
    } catch (err) {
        console.log("[Audit Trail] elasticsearch search error", err)
        return null
    }
}