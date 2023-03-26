function getOrigin(headers) {
  const origin = headers ? headers.get('origin') : '';
  return origin;
}

function isValidOrigin(origin) {
  const allowedOrigins = [
    'https://recaptchav3--afb-gdrive--pareesh.hlx.page',
    'https://recaptchav3--afb-gdrive--pareesh.hlx.live',
    'https://recaptchav2--afb-gdrive--pareesh.hlx.page',
    'https://recaptchav2--afb-gdrive--pareesh.hlx.live'
  ];

  return allowedOrigins.includes(origin);
}

function getResponseHeaders(origin) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'POST')
  headers.set('Access-Control-Allow-Headers', 'access-control-allow-headers, g-recaptcha, Content-Type')
  headers.set('Access-Control-Max-Age', 86400);
  return headers;
}

function getResponse(body, status, headers) {
  return new Response(body, { status: status, headers: headers });
}

async function handleRequest(request, env, origin) {
  const responseHeaders = getResponseHeaders(origin);

  try {
    const requestMethod = request.method;

    if (requestMethod === 'OPTIONS') {
      return getResponse('', 200, responseHeaders);
    }

    if (requestMethod !== 'POST') {
      return getResponse('Invalid request method', 400, responseHeaders);
    }

    const recaptchaToken = request.headers.get('g-recaptcha');
    if (!recaptchaToken) {
      return getResponse('No Recaptcha Token', 400, responseHeaders);
    }

    const { type } = await request.json();

    let response = new Response(JSON.stringify({ success: false }), { status: 400 });

    if (type === 'recaptchav3') {
      const secret = env.SECRET_V3;

      response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`, {
          method: 'POST'
        }
      )
    } else if (type === 'recaptchav2') {
      const secret = env.SECRET_V2;

      response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`, {
          method: 'POST'
        }
      )
    } else {
      return getResponse('Captcha type not specified', 400, responseHeaders);
    }


    const body = await response.json();

    console.log(body);

    if (body.success) {
      return getResponse('Pass', 202, responseHeaders);
    }

    return getResponse('Fail', 400, responseHeaders);
  } catch(err) {
    console.error(err);
    return getResponse(err.stack, 500, responseHeaders);  
  }
}

async function get(request, env) {
  const origin = getOrigin(request.headers);
  const isValid = isValidOrigin(origin);
  return isValid ? await handleRequest(request, env, origin) : new Response('', { status: 404 });
}

export default {
  fetch: get
}

