import { Client } from 'https://deno.land/x/postgres/mod.ts'

const getConnection = async () => {
  const client = new Client(Deno.env.get('POSTGRES_URL'))
  await client.connect()
  return client
}

export default getConnection
