import getConnection from '../database.ts'

export const fetchDevices = () =>
  getConnection()
    .then(connection =>
      connection
        .query('SELECT * FROM devices;')
        .then(({ rows }: any) => rows)
        .finally(() => connection.end())
    )

export const postDevice = (body: any) =>
  getConnection()
    .then(connection =>
      connection
        .query('INSERT * INTO devices (mac, meta) VALUES (?, ?)', [Object.values(body)])
        .then(() => body)
        .finally(() => connection.end())
    )

