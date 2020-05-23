import getConnection from '../database.ts'

export interface DiscoveryPostBody {
  columbus: string
  america: string
}

type Discovery = DiscoveryPostBody

export const addDiscovery = ({ america, columbus }: DiscoveryPostBody): Promise<Discovery> =>
  getConnection()
    .then(connection =>
      connection
        .query('INSERT INTO discoveries (columbus, america) VALUES ($1, $2)', columbus, america )
        .then(() => ({ america, columbus }))
        .finally(() => connection.end())
    )

export const fetchDiscoveriesFor = (device: string): Promise<string[]> =>
  getConnection()
    .then(connection =>
      connection
        .query('SELECT america FROM discoveries WHERE columbus = $1', device)
        .then(({ rows }: { rows: string[][] }) => rows.flatMap(e => e))
        .finally(() => connection.end())
    )

