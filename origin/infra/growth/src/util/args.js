/*
 * Parse command line arguments into a dict.
 * @returns {Object} - Parsed arguments.
 */
function parseArgv() {
  const args = {}
  for (const arg of process.argv) {
    const elems = arg.split('=')
    const key = elems[0]
    const val = elems.length > 1 ? elems[1] : true
    args[key] = val
  }
  return args
}

module.exports = parseArgv
