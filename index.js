import React, { useState, useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styled from "styled-components";

const columnIdSet = new Set()
const columnItemIdSet = new Set()

const generateColumnId = () => {
  const uuid = 'column' + parseInt(Math.random() * 100000)
  if (columnIdSet.has(uuid)) {
    return generateColumnId()
  }
  columnIdSet.add(uuid)
  return uuid
}

const generateColumnItemId = () => {
  const uuid = 'item' + parseInt(Math.random() * 100000)
  if (columnItemIdSet.has(uuid)) {
    return generateColumnItemId()
  }
  columnItemIdSet.add(uuid)
  return uuid
}

// style
const ContainerWrap = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  /* width: 100%; */
  overflow: auto;
  background: #F5F5F5;
`

const ItemContainer = styled.div`
  background: ${props => props.$isDraggingOver ? '#C8E6C9' : '#FFFFFF'};
  padding : 16px;
  width: 230px;
  margin-left : 10px;
  margin-right: 10px;
  border-radius: 12px;
  border: 1px solid #D1D1D1;

  ${props => props.$containerBlocked && `
    background : #FFCDD2;
    border : #EF9A9A;
  `}
  
`

const DraggableItem = styled.div`
  position: relative;
  user-select: none;
  padding: 16px;
  margin: 0 0 8px 0 ;
  background: #E8F5E9;
  border: 1px solid #C8E6C9;
  border-radius: 6px;
  color: #333333;

  /* ${props => props.$selected && `
  background : lightgreen;
  border : 1px solid black;
  `} */
/*
  ${props => props.$multiDragging && `
    background : grey;
  `}

  ${props => props.$isDragging && `
    background : lightgreen;
  `}
  
  ${props => props.$itemBlocked && `
    background : red;
  `} */
`

const AddItemButton = styled(DraggableItem)`
  cursor: pointer;
  background: #FFECB3;
  color : #8D6E63; 
  &:hover{
      background: #FFD54F;
      color: #FFFFFF;
    }

`

const AddColumnButton = styled(ItemContainer)`
  background: #FFCCBC;
  font-size: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #6D4C41;
  cursor: pointer;
  
  &:hover {
    background: #FFAB91;
    color: #FFFFFF;
  }
  
`

const SumOfItems = styled.div`
  position: absolute;
  right: -10;
  top : -10;
  width: 25px;
  height: 25px;
  background: #FF6F61;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 50%;
`

function App() {

  // 조건문이 복잡해서 
  const getItemStyle = useCallback((basicStyle, selectedItemIds, itemId, currentDraggingId, itemBlocked) => {
    console.log(currentDraggingId)
    if (currentDraggingId === itemId && !itemBlocked) {
      return {
        ...basicStyle,
        background: '#B2DFDB',
        boxShadow: '0 4px 8px rgba(0, 150, 136, 0.2)',
        border: '1px solid #80CBC4',
        opacity: 0.9
      }
    }
    if (currentDraggingId == itemId && itemBlocked) {
      return {
        ...basicStyle,
        background: '#FFCDD2',
        border: '1px solid #EF9A9A',
        opacity: 0.9,
      }
    }
    if (selectedItemIds.includes(itemId)) {
      console.log(itemId, currentDraggingId)
      if (currentDraggingId && currentDraggingId !== itemId) {
        return {
          ...basicStyle,
          background: '#B3E5FC',
          color : '#0288D1',
          opacity: 0.8,
        }
      }
      else {
        return {
          ...basicStyle,
          background: '#A5D6A7',
          border: '1px solid #66BB6A'
        }
      }
    }
    return basicStyle
  }, [])


  const getItems = (num, count) =>
    Array.from({ length: count }, (num, k) => k).map((k) => ({
      id: generateColumnItemId(),
      content: `item${num} ${k + 1}`,
      number: k + 1
    }));

  // 단일 아이템 추가
  const getItem = (num, count) => {
    return {
      id: generateColumnItemId(),
      content: `item${num} ${count + 1}`,
      number: count + 1
    }
  }

  const [containerBlocked, setContainerBlocked] = useState(false) // 첫번째 컬럼 -> 세번째 컬럼 block
  const [itemBlocked, setItemBlocked] = useState(false) // 아이템 이동 불가 block
  const [selectedItemIds, setSelectedItemIds] = useState([]) // 다중 선택시 선택된 아이템
  const [currentColumn, setCurrentColumn] = useState(null)
  const [currentDraggingId, setCurrentDraggingId] = useState('')
  const [columns, setColumns] = useState([
    {
      id: generateColumnId(),
      items: getItems(1, 5)
    },

    {
      id: generateColumnId(),
      items: []
    },

    {
      id: generateColumnId(),
      items: []
    },

    {
      id: generateColumnId(),
      items: []
    }
  ])


  const onDragEnd = (result) => {
    setCurrentDraggingId(null)
    console.log(result)
    if (!result.destination || !result.source) {
      return;
    }

    const {
      destination,
      source,
      draggableId
    } = result

    const { droppableId: destDroppableId, index: destIndex } = destination
    const { droppableId: sourceDroppableId, index: sourceIndex } = source

    // setSelectedItems([]) // drop후 다중선택 초기화

    // 1. 같은 DroppableId 내에 있는 경우
    // 1-1. 기존 방식의 splice를 이용한 setItem()
    if (sourceDroppableId === destDroppableId) {

      const newColumns = [...columns]
      const sourceColumn = newColumns.find(column => column.id === sourceDroppableId)
      if (!sourceColumn) {
        alert('cannot find target column')
        return;
      }

      // 5.같은 컬럼에서 다중 아이템이동 (2개 이상)
      if (selectedItemIds.length > 1) {

        const finalDestIndex = sourceIndex < destIndex ? destIndex + 1 : destIndex
        // 1. 선택된 아이템을 가져오고 나머지 아이템으로 구성된 Array를 만들어준다.(+ sorting)
        const sourceItems = sourceColumn.items
        // 선택된 아이템 변수
        const selectedItems = []
        // 선택된 아이템 이외의 아이템을 위한 변수
        const filteredSourceItems = sourceItems.filter(item => {
          if (selectedItemIds.includes(item.id)) {
            selectedItems.push(item)
            return false
          } else {
            return true
          }
        })
        // 선택된 sorting
        let draggableItem
        const sortedSelectedItems = []

        selectedItems.forEach(item => {
          if (item.id === draggableId) {
            draggableItem = { ...item, moved: true }
          } else {
            sortedSelectedItems.push({ ...item, moved: true })
          }
        })
        sortedSelectedItems.unshift(draggableItem)

        // 짝수 아이템 이동불가 처리
        if (draggableItem?.number % 2 === 0 &&
          sourceItems[finalDestIndex]?.number % 2 === 0
        ) {
          console.log('짝수')
          setItemBlocked(false)

          setSelectedItemIds([])
          return;
        }

        sourceItems.splice(finalDestIndex, 0, ...sortedSelectedItems)
        console.log(sourceItems)
        sourceColumn.items = sourceItems.reduce((acc, item) => {
          if (selectedItemIds.includes(item.id)) {
            if (!item.moved) {
              return acc
            }
            delete item.moved
          }
          acc.push(item)
          return acc
        }, [])
        // reduce는 이와 같음
        // let acc = []
        // for (let i = 0; i < sourceItems.length; i++) {
        //   const item = sourceItems[i]
        //   if (selectedItemIds.includes(item.id)) {
        //     if (!item.moved) {
        //       continue;
        //     }
        //     delete item.moved
        //   }
        //   acc.push(item)
        // }
        setColumns(newColumns)
        setSelectedItemIds([])

        return;
      } else {
        const sourceItems = sourceColumn.items
        const splicedItems = sourceItems.splice(sourceIndex, 1) // 자료구조 어레이
        const destColumn = newColumns.find(column => column.id === destDroppableId);
        const destItems = destColumn.items
        if (!destColumn) {
          return;
        }

        // console.log(destItems.length) // 실제 길이는 10이지만, 9가 나오는 이유 : splicedItems로 인해 배열의 변화가 일어남
        // 4-1. 짝수 아이템은 다른 짝수 아이템 앞으로 이동 불가
        if (splicedItems[0].number % 2 === 0 &&
          destIndex < destItems.length &&  // destItems.length가 줄어들었기 때문에 마지막 인덱스 이상으로 접근 못하게 함
          destItems[destIndex].number % 2 === 0

        ) {
          setItemBlocked(false) // drag끝난 뒤 state초기화
          sourceItems.splice(sourceIndex, 0, splicedItems[0]) //splicedItems는 원본 배열(newColums)에서 빠진 상태. splice()는 원본을 수정한다.
          return; // 따라서 이 상태에서 배열 복구 없이 return만 한다면 원본 배열에서 splicedItems이 사라진 상태로 업데이트됨.
        }


        sourceItems.splice(destIndex, 0, splicedItems[0])
        setColumns(newColumns)
        setSelectedItemIds([])

      }
    }

    // 2. 다른 DroppableId 간의 이동일 경우
    // if(result.source.droppableId != result.)
    // 2-1. source의 DroppableId에서 source 제거, 및 재배열(index - 1)
    // 2-2
    // 2-3. destination의 DroppableId에서 destination.index자리에 source추가 및 재배열(index + 1)
    else if (destDroppableId !== sourceDroppableId) {
      // 3. 첫번째 컬럼에서 세번째 컬럼으로 이동 불가
      if (columns.length >= 3) {
        if (sourceDroppableId == columns[0].id && destDroppableId == columns[2].id) {
          setContainerBlocked(false) // drag끝난 뒤 state 초기화
          return; //이 부분은 단순 조건 검사이기 때문에 특정 조건에서 drop을 아예 차단하고 있기 때문
        }
      }

      const newColumns = [...columns]
      const sourceColumn = newColumns.find(column => column.id === sourceDroppableId)
      if (!sourceColumn) {
        alert('cannot find target column')
        return;
      }

      const sourceItems = [...sourceColumn.items]
      const destColumn = newColumns.find(column => column.id === destDroppableId)
      if (!destColumn) {
        return;
      }
      const destItems = [...destColumn.items]

      // 5.1 다른컬럼으로 다중아이템 이동 (2개이상)
      if (selectedItemIds.length > 1) {
        const finalDestIndex = sourceIndex < destIndex ? destIndex + 1 : destIndex
        // 1. 선택된 아이템을 가져오고 나머지 아이템으로 구성된 Array를 만들어준다.(+ sorting)
        // 선택된 아이템 변수
        const selectedItems = []
        // 선택된 아이템 이외의 아이템을 위한 변수
        const filteredSourceItems = sourceItems.filter(item => {
          if (selectedItemIds.includes(item.id)) {
            selectedItems.push(item)
            return false
          } else {
            return true
          }
        })
        // 선택된 sorting
        let draggableItem
        const sortedSelectedItems = selectedItems.filter(item => {
          if (item.id === draggableId) {
            draggableItem = { ...item };
            return false;
          }
          return true;
        });

        sortedSelectedItems.unshift(draggableItem)

        // // 짝수 아이템 이동불가 처리
        if (draggableItem?.number % 2 === 0 &&
          destItems[destIndex]?.number % 2 === 0
        ) {
          setItemBlocked(false)
          setSelectedItemIds([])

          return;
        }


        destItems.splice(finalDestIndex, 0, ...sortedSelectedItems)
        sourceColumn.items = filteredSourceItems
        destColumn.items = destItems

        setColumns(newColumns)
        setSelectedItemIds([])
        return;
      }
      else {
        const newColumns = [...columns]
        const sourceColumn = newColumns.find(column => column.id === sourceDroppableId)
        if (!sourceColumn) {
          alert('cannot find target column')
          return;
        }

        const sourceItems = sourceColumn.items
        const splicedItems = sourceItems.splice(sourceIndex, 1) //소스 가져옴
        const destColumn = newColumns.find(column => column.id === destDroppableId)
        if (!destColumn) {
          return;
        }

        const destItems = destColumn.items

        // 4-2. 짝수 아이템은 다른 짝수 아이템 앞으로 이동 불가
        if (splicedItems[0].number % 2 === 0 &&
          destIndex < destItems.length &&  // destItems.length가 줄어들었기 때문에 마지막 인덱스 이상으로 접근 못하게 함
          destItems[destIndex].number % 2 === 0) {
          sourceItems.splice(sourceIndex, 0, splicedItems[0]) //splicedItems는 원본 배열(newColums)에서 빠진 상태. splice()는 원본을 수정한다.
          setSelectedItemIds([])

          return; // 따라서 이 상태에서 배열 복구 없이 return만 한다면 원본 배열에서 splicedItems이 사라진 상태로 업데이트됨.
        }

        destItems.splice(destIndex, 0, splicedItems[0])

        setColumns(newColumns)
        setSelectedItemIds([])
      }

    }
  }

  const onDragStart = (start) => {
    setContainerBlocked(false)
    console.log(start.draggableId)
    setItemBlocked(false)
    console.log(start)

    if (!start.source) {
      return
    }

    const {
      source,
      draggableId
    } = start

    const { droppableId: sourceDroppableId, index: sourceIndex } = source


    console.log('dragging right now')
    setCurrentDraggingId(draggableId)

  }


  // 드래그 중 예외처리 css처리 함수
  const onDragUpdate = (result) => {
    if (!result.destination || !result.source) {
      return;
    }

    const { destination,
      source
    } = result

    const { droppableId: destDroppableId, index: destIndex } = destination
    const { droppableId: sourceDroppableId, index: sourceIndex } = source

    if (columns.length >= 3) {
      if (sourceDroppableId == columns[0].id && destDroppableId == columns[2].id) {
        setContainerBlocked(true)
      } else {
        setContainerBlocked(false)
      }

    }

    if(selectedItemIds.length > 1) {
      console.log('large')
    }

    const newColumns = [...columns];
    const sourceColumn = newColumns.find(column => column.id === sourceDroppableId);
    const destColumn = newColumns.find(column => column.id === destDroppableId);
    const sourceItems = [...sourceColumn.items]
    const slicedItems = sourceItems[sourceIndex] // splice는 원본 배열에 영향을 주므로 slice로 복사본 만듬
    const destItems = [...destColumn.items]

    // 동일 컬럼 간 짝수 제약 조건
    if (sourceDroppableId === destDroppableId) {
      const isDraggingDown = destIndex > sourceIndex // 드래그 방향에 따라 destItems[destIndex].number가 바뀜
      const adjacentIndex = isDraggingDown ? destIndex + 1 : destIndex // 아랫방향일경우와 윗방향일 경우

      if (
        slicedItems.number % 2 === 0 &&
        adjacentIndex >= 0 &&
        adjacentIndex < destItems.length &&
        destItems[adjacentIndex]?.number % 2 === 0 // 드래그 방향에 따라 dest아이템이 짝수인지 아닌지 판단
      ) {
        setItemBlocked(true)
      } else {
        setItemBlocked(false)
      }

      // 제자리 일때 기본 상태
      if (sourceIndex === destIndex) {
        setItemBlocked(false)
      }


    }
    //다른 컬럼 간 짝수 제약 조건
    else if (sourceDroppableId !== destDroppableId) {
      const adjacentIndex = destIndex
      if (
        slicedItems.number % 2 === 0 &&
        adjacentIndex >= 0 &&
        adjacentIndex < destItems.length &&
        destItems[adjacentIndex]?.number % 2 === 0
      ) {
        setItemBlocked(true)
      } else {
        setItemBlocked(false)
      }
    }

  }

  return (
    <ContainerWrap>
      <DragDropContext onDragUpdate={onDragUpdate} onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div style={{ display: 'flex' }}>
          {columns?.map((column, index) => {
            if (!column) {
              return;
            }
            const {
              id,
              items
            } = column
            return (
              <>
                <Droppable droppableId={id} isDropDisabled={!selectedItemIds}>
                  {(provided, snapshot) => (
                    <ItemContainer
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      $isDraggingOver={snapshot.isDraggingOver}
                      $containerBlocked={containerBlocked && snapshot.isDraggingOver}
                    >
                      {items?.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}
                          // 단일 아이템은 단일 드래그 가능, 그 외는 다중 선택 후 이동 시켜야 함.
                          isDragDisabled={!selectedItemIds?.includes(item.id) && selectedItemIds.length !== 0} >
                          {(provided, snapshot) => (
                            <>
                              <DraggableItem
                                // 다중 드래그 선택 onClick
                                onClick={() => {
                                  if (currentColumn !== id) { // 다중 선택은 같은 컬럼 내에서만 가능
                                    setCurrentColumn(id)
                                    setSelectedItemIds([item.id])
                                  }
                                  else {
                                    if (!selectedItemIds.includes(item.id)) {
                                      setSelectedItemIds([...selectedItemIds, item.id])
                                    } else {
                                      const newSelectedItems = selectedItemIds.filter(x => x !== item.id)
                                      setSelectedItemIds(newSelectedItems)
                                    }
                                  }
                                }}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                // $selected={selectedItemIds?.includes(item.id)}
                                // $isDragging={snapshot.isDragging}
                                // $multiDragging={currentDraggingId &&
                                //    selectedItemIds?.includes(item.id) &&
                                //     item.id !== currentDraggingId}
                                // $itemBlocked={itemBlocked && snapshot.isDragging}
                                style={getItemStyle(provided.draggableProps.style, selectedItemIds, item.id, currentDraggingId, itemBlocked)}
                              >
                                {selectedItemIds.length > 1 && currentDraggingId === item.id && (
                                  <SumOfItems>{selectedItemIds.length}</SumOfItems>
                                )}
                                {item.content}
                              </DraggableItem>
                            </>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* 단일 아이템 추가 버튼 */}
                      <AddItemButton
                        onClick={() => {
                          const newColumns = [...columns]

                          if (!column.items || !Array.isArray(column.items)) { // 예외처리
                            column.items = []
                          }

                          if (column.items.length === 0) {
                            const newColumnItem = getItem(index + 1, 0)
                            column.items.push(newColumnItem)
                          } else {
                            const newColumnItem = getItem(index + 1, column.items[column.items.length - 1].number)
                            column.items.push(newColumnItem)
                          }
                          setColumns(newColumns)

                        }}
                      >Add Item</AddItemButton>
                    </ItemContainer>
                  )}
                </Droppable>
              </>
            )
          })}
          {/* 새로운 컬럼 생성 버튼 */}
          <AddColumnButton
            onClick={() => {
              const newItems = []
              const newColumn = {
                id: generateColumnId(),
                items: newItems
              }
              const newColumns = [...columns, newColumn]
              setColumns(newColumns)
            }}
          >
            +</AddColumnButton>
        </div>
      </DragDropContext>
    </ContainerWrap>
  );
}


ReactDOM.render(<App />, document.getElementById("root"));
