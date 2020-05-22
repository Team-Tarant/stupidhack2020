import { Base64 } from "https://deno.land/x/bb64/mod.ts";

export const sendBeerQuestionTo = (phone: string) => {
  console.log('Sending message to', phone)
  const body = new FormData()
  body.append('Body', 'Hello do you have beer')
  body.append('From', Deno.env.get('TWILIO_PHONE')!)
  body.append('To', phone)
  return fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_ID')}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Base64.fromString(Deno.env.get('TWILIO_ACCOUNT_ID') + ":" + Deno.env.get('TWILIO_ACCOUNT_TOKEN')).toString()
      },
      body
    })
  }
