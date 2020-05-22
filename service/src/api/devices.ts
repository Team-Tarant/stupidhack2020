import getConnection from '../database.ts'

export interface DevicePostBody {
  mac: string
  meta: object
}

export interface Device {
  id: number
  mac: string
  meta: any
}

export const fetchDevices = (deviceIds: string[]): Promise<Device[]> =>
  !deviceIds.length ? Promise.resolve([]) :
  getConnection()
    .then(connection =>
      connection
      .query(`SELECT * FROM devices WHERE mac IN ('${deviceIds.join(`','`)}');`) // I fucking hate myself but this library is so shit
      .then(({ rows }: { rows: any[] }) =>
          rows.map(([id, mac, meta]) => ({ id, mac, meta })))
        .finally(() => connection.end())
    )

export const postDevice = (body: DevicePostBody) =>
  getConnection()
    .then(connection =>
      connection
        .query('INSERT INTO devices (mac, meta, push_notification_id) VALUES ($1, $2)', body.mac,JSON.stringify(body.meta))
        .then(() => body)
        .finally(() => connection.end())
    )
    

export const sendPushMessages = async (deviceIds: String[]) => {
  const wat = await fetch('https://onesignal.com/api/v1/notifications',{
    method: 'POST',
    headers: {
      Authorization: `Basic ${Deno.env.get('ONESIGNAL_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      include_external_user_ids: deviceIds,
      app_id: Deno.env.get('ONESIGNAL_APP_ID'),
      contents: {"en": "Beerist :D"},
      channel_for_external_user_ids: 'push',
      buttons: [{ id: "beer", text: "Lets beer", icon: "https://sinebrychoff.fi/media/22592/fi_karhu-5-3.png?height=1140&mode=max" }]

    })
  }).then(async (response) => {
    console.log(await response.text())
    return response.json();
  })
  return wat
}

export const getDataFor = (deviceIds: string[]) =>
  fetchDevices(deviceIds)
    .then(devices => devices.map(({ meta }) =>  meta ))
