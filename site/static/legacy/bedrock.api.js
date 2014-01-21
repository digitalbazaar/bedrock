/*!
 * Bedrock API
 *
 * This file provides methods to get data from and post data to the server.
 *
 * @requires jQuery v1.6+ (http://jquery.com/)
 *
 * @author Dave Longley
 */
(function($) {

// bedrock API
var bedrock = window.bedrock = window.bedrock || {};

// default @context
bedrock.CONTEXT_URL = 'https://w3id.org/bedrock/v1';

// identities API
bedrock.identities = {};

/**
 * Adds an identity to the current profile.
 *
 * Usage:
 *
 * bedrock.identities.add({
 *   identity: identity,
 *   success: function(identity) {},
 *   error: function(err) {}
 * });
 */
bedrock.identities.add = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: '/i',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(options.identity),
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Switches the current session's identity.
 *
 * Usage:
 *
 * bedrock.switchIdentity({
 *   identity: 'https://example.com/i/newidentity',
 *   redirect: 'https://example.com/new/page' (optional),
 *   error: function(err) {}
 * });
 */
bedrock.switchIdentity = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: '/profile/switch',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify({
      identity: options.identity,
      redirect: options.redirect || window.location.href
    }),
    error: function(xhr, textStatus, errorThrown) {
      if(xhr.status === 200) {
        window.location = options.redirect || window.location.href;
      }
      else {
        normalizeError(xhr, textStatus);
      }
    }
  });
};

// keys API
bedrock.keys = {};

/**
 * Get the keys for an identity.
 *
 * Usage:
 *
 * bedrock.keys.get({
 *   identity: 'https://example.com/i/myidentity',
 *   success: function(keys) {},
 *   error: function(err) {}
 * });
 */
bedrock.keys.get = function(options) {
  $.ajax({
    async: true,
    type: 'GET',
    url: options.identity + '/keys',
    dataType: 'json',
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Get a key.
 *
 * Usage:
 *
 * bedrock.keys.getOne({
 *   key: KEY_ID,
 *   success: function(key) {},
 *   error: function(err) {}
 * });
 */
bedrock.keys.getOne = function(options) {
  $.ajax({
    async: true,
    type: 'GET',
    url: options.key,
    dataType: 'json',
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Updates a key.
 *
 * Usage:
 *
 * bedrock.keys.update({
 *   key: key,
 *   success: function() {},
 *   error: function(err) {}
 * });
 */
bedrock.keys.update = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: options.key.id,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(options.key),
    success: function(response, statusText) {
      if(options.success) {
        options.success();
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Revokes a specific key for an identity.
 *
 * Usage:
 *
 * bedrock.keys.revoke({
 *   key: KEY_ID,
 *   success: function(key) {},
 *   error: function(err) {}
 * });
 */
bedrock.keys.revoke = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: options.key,
    contentType: 'application/json',
    data: JSON.stringify({
      '@context': bedrock.CONTEXT_URL,
      id: options.key,
      revoked: ''
    }),
    dataType: 'json',
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

// profiles API
bedrock.profiles = {};

/**
 * Logs in a profile.
 *
 * Usage:
 *
 * bedrock.profiles.login({
 *   profile: slug or email,
 *   password: password,
 *   ref: '/redirect/url' (optional),
 *   success: function(response) {},
 *   error: function(err) {}
 * });
 */
bedrock.profiles.login = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: '/profile/login',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify($.extend({
      profile: options.profile,
      password: options.password
    }, (options.ref) ? {ref: options.ref} : {})),
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Sends a password reset or a verification email to the provided and email
 * address or a profile name.
 *
 * Usage:
 *
 * bedrock.profiles.passcode({
 *   profile: {sysIdentifier: "foo@example.com"},
 *   [usage]: 'reset'/'verify',
 *   success: function() {},
 *   error: function(err) {}
 * });
 */
bedrock.profiles.passcode = function(options) {
  var url = '/profile/passcode?usage=';
  if(options.usage) {
    url += options.usage;
  }
  else {
    url += 'reset';
  }
  $.ajax({
    async: true,
    type: 'POST',
    url: url,
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(options.profile),
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Sets a password given an email to the provided and email address or
 * a profile name.
 *
 * Usage:
 *
 * bedrock.profiles.password({
 *   profile: {
 *     "sysIdentifier": "foo@example.com",
 *     "sysPasscode": "fhj32hfg8",
 *     "sysPasswordNew": "password12345",
 *   },
 *   success: function() {},
 *   error: function(err) {}
 * });
 */
bedrock.profiles.password = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: '/profile/password/reset',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(options.profile),
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Verifies an email address.
 *
 * Usage:
 *
 * bedrock.profiles.verifyEmail({
 *   profile: {
 *     "sysIdentifier": "foo@example.com",
 *     "sysPasscode": "fhj32hfg8"
 *   },
 *   success: function() {},
 *   error: function(err) {}
 * });
 */
bedrock.profiles.verifyEmail = function(options) {
  $.ajax({
    async: true,
    type: 'POST',
    url: '/profile/email/verify',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(options.profile),
    success: function(response, statusText) {
      if(options.success) {
        options.success(response);
      }
    },
    error: function(xhr, textStatus, errorThrown) {
      if(options.error) {
        options.error(normalizeError(xhr, textStatus));
      }
    }
  });
};

/**
 * Normalizes an error that occurred during an XHR.
 *
 * @param xhr the XHR.
 * @param textStatus the error status as text.
 *
 * @return the normalized error.
 */
function normalizeError(xhr, textStatus) {
  var error = null;

  try {
    error = JSON.parse(xhr.responseText);
    if(error.type === undefined) {
      error.type = 'website.Exception';
      error.message = 'An error occurred while communicating with ' +
        'the server: ' + textStatus;
    }
    // check for invalid session or missing session
    else if(error.type === 'bedrock.website.PermissionDenied') {
      // redirect to login
      // FIXME: support modal login to keep current state vs forced redirect
      window.location = '/profile/login?ref=' +
        encodeURIComponent(window.location.pathname) +
        '&expired=true';
    }
  }
  catch(e) {
    // not a json-formatted exception
    error = {
      type: 'website.Exception',
      message: 'An error occurred while communicating with ' +
        'the server: ' + textStatus
    };
  }
  return error;
}

})(jQuery);
