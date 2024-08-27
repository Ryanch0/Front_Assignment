export const columnIdSet = new Set()
export const columnItemIdSet = new Set()

export const generateColumnId = () => {
  const uuid = 'column' + parseInt(Math.random() * 100000)
  if (columnIdSet.has(uuid)) {
    return generateColumnId()
  }
  columnIdSet.add(uuid)
  return uuid
}

export const generateColumnItemId = () => {
  const uuid = 'item' + parseInt(Math.random() * 100000)
  if (columnItemIdSet.has(uuid)) {
    return generateColumnItemId()
  }
  columnItemIdSet.add(uuid)
  return uuid
}

export const insertColumnIds = (columnIds) => {
    columnIds.forEach(id => columnIdSet.add(id))
}

export const insertColumnItemIds = (columnItemIds) => {
    columnItemIds.forEach(id => columnItemIdSet.add(id))
    
}

export const resetAllSets = () => {
    columnIdSet.clear()
    columnItemIdSet.clear()
}