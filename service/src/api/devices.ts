import getConnection from '../database.ts'

export interface DevicePostBody {
  mac: string
  meta: object
}

export interface Device {
  id: number
  mac: string
  meta: object
}

export const fetchDevices = (deviceIds: string[]): Promise<Device[]> =>
  !deviceIds.length ? Promise.resolve([]) :
  getConnection()
    .then(connection =>
      connection
        .query('SELECT * FROM devices;')
        .then(({ rows }: { rows: any[] }) =>
          rows.map(([id, mac, meta]) => ({ id, mac, meta })))
        .finally(() => connection.end())
    )

export const postDevice = (body: DevicePostBody) =>
  getConnection()
    .then(connection =>
      connection
        .query('INSERT INTO devices (mac, meta) VALUES ($1, $2)', body.mac, JSON.stringify(body.meta))
        .then(() => body)
        .finally(() => connection.end())
    )

