import getConnection from '../database.ts'

export interface DevicePostBody {
  mac: string
  pushNotificationId: string
  meta: object
}

export interface Device {
  id: number
  mac: string
  pushNotificationId: string
  meta: any
}

export const fetchDevices = (deviceIds: string[]): Promise<Device[]> =>
  !deviceIds.length ? Promise.resolve([]) :
  getConnection()
    .then(connection =>
      connection
      .query(`SELECT * FROM devices WHERE mac IN ('${deviceIds.join(`','`)}');`) // I fucking hate myself but this library is so shit
      .then(({ rows }: { rows: any[] }) =>
          rows.map(([id, mac, meta, pushNotificationId]) => ({ id, mac, meta, pushNotificationId })))
        .finally(() => connection.end())
    )

export const postDevice = (body: DevicePostBody) =>
  getConnection()
    .then(connection =>
      connection
        .query('INSERT INTO devices (mac, meta, push_notification_id) VALUES ($1, $2, $3)', body.mac, JSON.stringify(body.meta), body.pushNotificationId)
        .then(() => body)
        .finally(() => connection.end())
    )
    

export const sendPushMessages = async (deviceIds: string[]) => {
  const devices = await fetchDevices(deviceIds);
  console.log('deviceIDs', deviceIds)
  console.log('devices', devices)
  const realDeviceIds = devices.map(({ pushNotificationId }) => pushNotificationId)
  console.log('realDeviceIds', realDeviceIds)
  return await Promise.all(realDeviceIds.map(id =>
    fetch('https://onesignal.com/api/v1/notifications',{
      method: 'POST',
      headers: {
        Authorization: `Basic ${Deno.env.get('ONESIGNAL_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        include_player_ids: [id], // ['foobar123']
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        contents: {'en': 'Beerist :D'},
        channel_for_external_user_ids: 'push'

      })
    }).then(async (response) => {
      console.log(await response.text())
      return response.json()
    })
  ))
}

export const getDataFor = (deviceIds: string[]) =>
  fetchDevices(deviceIds)
    .then(devices => devices.map(({ meta }) =>  meta ))
