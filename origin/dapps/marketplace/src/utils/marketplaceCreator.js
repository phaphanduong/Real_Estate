import setLocale from 'utils/setLocale'
import camelToDash from 'utils/camelToDash'

/* Determine if the DApp is being white labelled by comparing the current
 * hostname with a list of non-whitelabel hostnames.
 */
function isWhiteLabelHostname() {
  const { hostname } = window.location
  const exceptionNeedles = [
    /dapp?\.((staging|dev)\.)?originprotocol\.com/,
    /localhost/,
    /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/ // IP addresses
  ]
  return !exceptionNeedles.some(needle => hostname.match(needle))
}

function applyConfiguration(config) {
  // Set CSS variables on the body from the config
  for (const [cssVarName, cssVarValue] of Object.entries(config.cssVars)) {
    // Don't allow url() CSS variables
    if (cssVarValue.toString().match(/url *\(/)) {
      throw 'url() not allowed in DApp CSS variables'
    }

    document.documentElement.style.setProperty(
      `--${camelToDash(cssVarName)}`,
      cssVarValue
    )
  }

  // Set the page title
  if (config.title) {
    document.title = config.title
    const metaTitleElement = document.querySelector('meta[name="title"]')
    if (metaTitleElement) {
      metaTitleElement.setAttribute('content', config.title)
    }
  }

  // Set the language code
  if (config.languageCode) {
    setLocale(config.languageCode)
  }

  // Set the favicon
  if (config.faviconUrl) {
    let faviconElement = document.querySelector('link[rel="icon"]')
    if (!faviconElement) {
      faviconElement = document.createElement('link')
      faviconElement.setAttribute('rel', 'icon')
      const head = document.querySelector('head')
      head.appendChild(faviconElement)
    }
    faviconElement.setAttribute('href', config.faviconUrl)
  }
}

export { isWhiteLabelHostname, applyConfiguration }
