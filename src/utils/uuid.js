
// Set객체는 중복 값을 허용하지 않음, 따라서 Column or Item의 Id를 효율적으로 저장 가능
// Set객체에는 기본 메서드로 (add, delete, clear, has) 존재
export const columnIdSet = new Set()
export const columnItemIdSet = new Set()

// Column에 고유한 key값을 부여하기 위해 유니크한 아이디를 랜덤해서 생성
// 생성한 아이디가 이미 존재할 경우 함수를 재실행
export const generateColumnId = () => {
  const uuid = 'column' + parseInt(Math.random() * 100000)
  if (columnIdSet.has(uuid)) {
    return generateColumnId()
  }
  columnIdSet.add(uuid)
  return uuid
}

// Item에 고유한 key값을 부여하기 위해 유니크한 아이디를 랜덤해서 생성
// 생성한 아이디가 이미 존재할 경우 함수를 재실행
export const generateColumnItemId = () => {
  const uuid = 'item' + parseInt(Math.random() * 100000) //Math.random()은 0이상 1미만의 난수를 생성하고, parseInt로 인해 정수로 변환
  if (columnItemIdSet.has(uuid)) {
    return generateColumnItemId()
  }
  columnItemIdSet.add(uuid)
  return uuid
}


// id중복검사
export const insertColumnIds = (columnIds) => {
    columnIds.forEach(id => columnIdSet.add(id))
}

// id중복검사
export const insertColumnItemIds = (columnItemIds) => {
    columnItemIds.forEach(id => columnItemIdSet.add(id))
    
}


// id초기화 (columns state 초기값 설정시)
export const resetAllSets = () => {
    columnIdSet.clear()
    columnItemIdSet.clear()
}