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

export const getDevice = (mac: string): Promise<Device | null> =>
  getConnection()
  .then(connection =>
    connection
    .query(`SELECT * FROM devices WHERE mac = $1 LIMIT 1;`, mac)
    .then(({ rows }: { rows: any[] }) =>
        rows.map(([id, mac, meta, pushNotificationId]) => ({ id, mac, meta, pushNotificationId }))[0])
      .finally(() => connection.end())
  )

export const sendPushMessages = async (deviceIds: string[]) => {
  const devices = await fetchDevices(deviceIds);
  const bonttosongs = [
    'https://open.spotify.com/track/4Uw28Ky8prjtfg8e5xKbyQ?si=UAa9wescRHWa7Fepvf-gaQ',
    'https://open.spotify.com/track/4sQ62KeHdGyW5Ir7o9BkKy?si=QsLtjRNPTymalFy2hksG8w',
    'https://open.spotify.com/track/1bsAcer3SaVUOxtstOnlqO?si=qOUUgJ55TeSDnC4E588-Bw'
  ]
  return await Promise.all(devices.map(({ meta, mac }) =>
    fetch('https://onesignal.com/api/v1/notifications',{
      method: 'POST',
      headers: {
        Authorization: `Basic ${Deno.env.get('ONESIGNAL_API_KEY')}`,
        'Content-Type': 'application/json'
      },  
      body: JSON.stringify({
        include_external_user_ids: [mac],
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        contents: {'en': `Hello ${meta.name}, do u have beer`},
        channel_for_external_user_ids: 'push',
        buttons: [
          { 
            id: "beer",
            text: "Lets beer",
            url: bonttosongs[Math.floor(Math.random() * bonttosongs.length)]
          }
        ],
        data: {phone: meta.phone}
    
      })
    }).then(async (response) => {
      console.log(await response.text())
      return response.json()
    })
  ))
}

export const sendTarantedNotification = async (deviceIds: string[], host: string) => {
  console.log('tarant notif deviceIds ', deviceIds)
  const devices = await fetchDevices(deviceIds);
  console.log('tarant notif devices ', deviceIds)
  const dataForHost = await getDataFor(host)
  const bonttosongs = [
    'https://open.spotify.com/track/4Uw28Ky8prjtfg8e5xKbyQ?si=UAa9wescRHWa7Fepvf-gaQ',
    'https://open.spotify.com/track/4sQ62KeHdGyW5Ir7o9BkKy?si=QsLtjRNPTymalFy2hksG8w',
    'https://open.spotify.com/track/1bsAcer3SaVUOxtstOnlqO?si=qOUUgJ55TeSDnC4E588-Bw'
  ]
  if (!dataForHost) return Promise.reject('No host found')
  return await Promise.all(devices.map(({ meta, mac }) =>
    fetch('https://onesignal.com/api/v1/notifications',{
      method: 'POST',
      headers: {
        Authorization: `Basic ${Deno.env.get('ONESIGNAL_API_KEY')}`,
        'Content-Type': 'application/json'
      },  
      body: JSON.stringify({
        include_external_user_ids: [mac],
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        contents: {'en': `Hello ${meta.name}! ${dataForHost.name} is unfortunately drunk. Be careful :D`},
        channel_for_external_user_ids: 'push',
        big_picture: 'https://nc.lavikjo.com/index.php/apps/files_sharing/publicpreview/z2ro8RexRmeKamc?x=2868&y=712&a=true&file=kaleksi2_small.png&scalingup=0',
        small_icon: 'https://nc.lavikjo.com/index.php/apps/files_sharing/publicpreview/z2ro8RexRmeKamc?x=2868&y=712&a=true&file=kaleksi2_small.png&scalingup=0',
        big_icon: 'https://nc.lavikjo.com/index.php/apps/files_sharing/publicpreview/z2ro8RexRmeKamc?x=2868&y=712&a=true&file=kaleksi2_small.png&scalingup=0',
        large_icon: 'https://nc.lavikjo.com/index.php/apps/files_sharing/publicpreview/z2ro8RexRmeKamc?x=2868&y=712&a=true&file=kaleksi2_small.png&scalingup=0',
        android_background_layout: {"image": "https://nc.lavikjo.com/index.php/apps/files_sharing/publicpreview/z2ro8RexRmeKamc?x=2868&y=712&a=true&file=kaleksi2_small.png&scalingup=0", "headings_color": "ff9ec2", "contents_color": "ff9ec2"},
        android_accent_color: '#ff9ec2',
        buttons: [
          { id: 'beer', text: 'Lets beer :D', url: bonttosongs[Math.floor(Math.random() * bonttosongs.length)] },
          { id: 'nobeer', text: 'Lets not :(' }

      ],
      data: {phone: dataForHost.phone}

      })
    }).then(async (response) => {
      console.log(await response.text())
      return response.json()
    })
  ))
}

export const getDataFor = (deviceId: string) =>
  fetchDevices([deviceId])
    .then(devices => devices.length > 0 ? devices[0].meta : null)
