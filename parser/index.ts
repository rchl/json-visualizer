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
    groups: parseNode(node),
  }
}

function parseNode(node: jsonToAst.ValueNode): FoamGroup[] {
  if (node.type === 'Array')
    return parseArray(node)
  if (node.type === 'Object')
    return parseObject(node)
  console.error('Unknown', node.type)
  return []
}

function parseArray(node: jsonToAst.ArrayNode): FoamGroup[] {
  const groups: FoamGroup[] = []
  for (const [index, child] of node.children.entries()) {
    groups.push({
      label: child.type === 'Literal' ? nodeLabel(child) : `[${index}]\n${bytes(nodeSize(child.loc))}`,
      weight: nodeSize(child.loc),
      ...(child.type === 'Literal' ? {} : { groups: parseNode(child) }),
    })
  }
  return groups
}

function parseObject(node: jsonToAst.ObjectNode): FoamGroup[] {
  const groups: FoamGroup[] = []
  for (const child of node.children) {
    if (child.type === 'Property')
      groups.push(parseProperty(child))
    else
      console.error('Unknown', child.type)
  }
  return groups
}

function parseProperty(node: jsonToAst.PropertyNode): FoamGroup {
  return {
    label: nodeLabel(node),
    weight: nodeSize(node.loc),
    ...(node.value.type === 'Literal' ? {} : { groups: parseNode(node.value) }),
  }
}

function nodeSize(loc: jsonToAst.Location | undefined) {
  if (!loc)
    return 0

  return loc.end.offset - loc.start.offset
}

function nodeLabel(node: jsonToAst.ASTNode): string {
  if (node.type === 'Property') {
    const propertyNode = node as jsonToAst.PropertyNode
    let key = propertyNode.key.value
    if (propertyNode.value.type === 'Array')
      key = `[${key}]`

    return `${key}\n${bytes(nodeSize(node.loc))}`
  }
  else if (node.type === 'Literal') {
    const literalNode = node as jsonToAst.LiteralNode
    return `${literalNode.value}\n${bytes(nodeSize(node.loc))}`
  }
  else if (node.type === 'Object') {
    return `${bytes(nodeSize(node.loc))}`
  }
  return `<no label> (${node.type})`
}
