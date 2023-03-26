function getOrigin(headers) {
  const referrer = headers ? headers.get('Referer') : '';
  if (referrer) {
    const { origin } = new URL(referrer);
    return origin;
  }
  return '';
}

function isValidOrigin(origin) {
  console.log(origin);
  return origin === 'https://recaptchav3--afb-gdrive--pareesh.hlx.page' || origin === 'https://recaptchav3--afb-gdrive--pareesh.hlx.live';
}

function getResponseHeaders(origin) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'POST')
  headers.set(
    'Access-Control-Allow-Headers',
    'access-control-allow-headers, g-recaptcha'
  )
  headers.set('Access-Control-Max-Age', 86400)
  return headers;
}

function getResponse(body, status, headers) {
  return new Response(body, {
    status: status,
    headers: headers
  });
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

    const secret = env.SECRET;

    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${recaptchaToken}`, {
        method: 'POST'
      }
    )

    const body = await response.json();

    console.log(body);

    if (!body.success) {
      return getResponse('Fail', 400, responseHeaders);
    }

    return getResponse('Pass', 202, responseHeaders);
  } catch(err) {
    console.error(err);
    return getResponse(err.stack, 500, responseHeaders);  
  }
}

async function get(request, env) {
  const origin = getOrigin(request.headers);
  const isValid = isValidOrigin(origin);

  if (isValid) {
    return await handleRequest(request, env, origin);
  } else {
    return new Response('', { status: 404 });
  }
}

export default {
  fetch: get
}

