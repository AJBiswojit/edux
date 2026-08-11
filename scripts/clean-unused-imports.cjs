/**
 * One-time audit cleanup: removes named imports that are never referenced
 * in the file. Conservative rules:
 *  - specifier must have ZERO word-boundary occurrences outside the import
 *  - specifier must not appear inside any quoted string (prevents false
 *    positives with data strings / dynamic lookups)
 * Runs read-only unless --write is passed.
 */
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')

function walk(dir) {
  let out = []
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    const st = fs.statSync(p)
    if (st.isDirectory()) out = out.concat(walk(p))
    else if (f.endsWith('.jsx') || f.endsWith('.js')) out.push(p)
  }
  return out
}

function removeSpecifier(src, importText, name) {
  // text range of the specifier inside the import statement
  const re = new RegExp(`\\b${name}\\b`)
  const m = re.exec(importText)
  if (!m) return importText
  // expand to full specifier incl. alias:  Name as Alias
  let start = m.index
  let end = m.index + name.length
  const alias = importText.slice(end).match(/^\s+as\s+([A-Za-z_$][\w$]*)/)
  if (alias) end += alias[0].length
  // cut leading comma + spaces OR trailing comma
  let out = importText
  const before = out.slice(0, start)
  const after = out.slice(end)
  if (before.trimEnd().endsWith(',')) {
    out = before.replace(/,\s*$/, '') + after
  } else if (after.trimStart().startsWith(',')) {
    out = before + after.replace(/^\s*,\s*/, '')
  } else {
    out = before + after
  }
  return out
}

let totalRemoved = 0
const fileReport = []

for (const file of walk('src')) {
  const src = fs.readFileSync(file, 'utf8')
  if (!src.includes('import { ')) continue
  // quoted strings in the file (single or double quotes, not template)
  const quoted = new Set()
  for (const m of src.matchAll(/'([^']*)'/g)) quoted.add(m[1])
  for (const m of src.matchAll(/"([^"]*)"/g)) quoted.add(m[1])

  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]\s*;?/g
  let removedInFile = []
  let modified = false
  let current = src

  const statements = [...current.matchAll(importRe)]
  // process from last to first so indexes stay valid
  for (let si = statements.length - 1; si >= 0; si--) {
    const stmt = statements[si]
    const body = stmt[1]
    const names = body.split(',').map((n) => n.trim()).filter(Boolean)
    const pending = names.filter((n) => {
      const local = n.split(/\s+as\s+/).pop().trim()
      if (!/^[A-Za-z_$]/.test(local)) return false
      const rest = current.replace(stmt[0], '')
      const re = new RegExp(`\\b${local}\\b`, 'g')
      if (re.test(rest)) return false
      if (quoted.has(local)) return false
      return true
    })
    if (!pending.length) continue
    let newBody = body
    for (const n of pending) {
      const local = n.split(/\s+as\s+/).pop().trim()
      newBody = removeSpecifier(newBody, newBody, local)
      removedInFile.push(local)
      totalRemoved++
    }
    const newStmt = stmt[0].replace(body, newBody)
    current = current.replace(stmt[0], newStmt)
    modified = true
  }

  if (modified) {
    fileReport.push({ file, names: removedInFile })
    if (WRITE) fs.writeFileSync(file, current)
  }
}

console.log(`Files with removable imports: ${fileReport.length}`)
console.log(`Total specifiers removed: ${totalRemoved}`)
for (const r of fileReport) console.log(`  ${r.file.split('src/')[1]}: ${r.names.join(', ')}`)
