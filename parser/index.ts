import bytes from 'bytes'
import type jsonToAst from 'json-to-ast'

export interface RootFoamGroup {
  groups: FoamGroup[]
}

interface FoamGroup {
  description?: boolean
  label: string
  groups?: FoamGroup[]
  weight?: number
}

export function parseRootNode(node: jsonToAst.ValueNode): RootFoamGroup {
  return {
    groups: parseNode(node, []),
  }
}

function parseNode(node: jsonToAst.ValueNode, keyPath: string[]): FoamGroup[] {
  if (node.type === 'Array')
    return parseArray(node, keyPath)
  if (node.type === 'Object')
    return parseObject(node, keyPath)
  console.error('Unknown', node.type)
  return []
}

function parseArray(node: jsonToAst.ArrayNode, keyPath: string[]): FoamGroup[] {
  const groups: FoamGroup[] = []
  for (const [index, child] of node.children.entries()) {
    const childKeyPath = [...keyPath, `[${index}]`]
    groups.push({
      label: child.type === 'Literal' ? nodeLabel(child, keyPath) : `${childKeyPath.join('')}\n${bytes(nodeSize(child.loc))}`,
      weight: nodeSize(child.loc),
      ...(child.type === 'Literal' ? {} : { groups: parseNode(child, childKeyPath) }),
    })
  }
  return groups
}

function parseObject(node: jsonToAst.ObjectNode, keyPath: string[]): FoamGroup[] {
  const groups: FoamGroup[] = []
  for (const child of node.children) {
    if (child.type === 'Property') {
      const childKeyPath = [...keyPath, `.${child.key.value}`]
      groups.push(parseProperty(child, childKeyPath))
    } else {
      console.error('Unknown', child.type)
    }
  }
  return groups
}

function parseProperty(node: jsonToAst.PropertyNode, keyPath: string[]): FoamGroup {
  return {
    label: nodeLabel(node, keyPath),
    weight: nodeSize(node.loc),
    ...(node.value.type === 'Literal' ? {} : { groups: parseNode(node.value, keyPath) }),
  }
}

function nodeSize(loc: jsonToAst.Location | undefined) {
  if (!loc)
    return 0

  return loc.end.offset - loc.start.offset
}

function nodeLabel(node: jsonToAst.ASTNode, keyPath: string[]): string {
  if (node.type === 'Property') {
    const propertyNode = node as jsonToAst.PropertyNode
    let key = propertyNode.key.value
    if (propertyNode.value.type === 'Array')
      key = [...keyPath, `[]`].join('')

    return `${key}\n${bytes(nodeSize(node.loc))}`
  }
  else if (node.type === 'Literal') {
    const literalNode = node as jsonToAst.LiteralNode
    const key = [...keyPath, `."${literalNode.value}"`].join('')
    return `${key}\n${bytes(nodeSize(node.loc))}`
  }
  else if (node.type === 'Object') {
    return `${bytes(nodeSize(node.loc))}`
  }
  return `<no label> (${node.type})`
}
