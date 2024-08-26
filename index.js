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
const ItemContainer = styled.div`
  background: ${props => props.$isDraggingOver ? 'lightblue' : 'lightgrey'};
  padding : 16px;
  width: 250px;
  margin-left : 20px;

  ${props => props.$containerBlocked && `
    background : red;
  `}
  
`

const DraggableItem = styled.div`
  user-select: none;
  padding: 16px;
  margin: 0 0 8px 0 ;
  background: grey;
  ${props => props.$isDragging && `
    background : lightgreen;
  `}

  ${props => props.$itemBlocked && `
    background : red;
  `}

  ${props => props.$selected && `
    border : 3px solid blue;
  `}
`



function App() {

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
  const [columns, setColumns] = useState([
    {
      id: generateColumnId(),
      items: getItems(1, 10)
    },

    {
      id: generateColumnId(),
      items: getItems(2, 10)
    },

    {
      id: generateColumnId(),
      items: getItems(3, 10)
    },

    {
      id: generateColumnId(),
      items: getItems(4, 10)
    }
  ])


  const onDragEnd = (result) => {
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
    if (destDroppableId === sourceDroppableId) {

      // 5.같은 컬럼에서 다중 아이템이동 (2개 이상)
      if (selectedItemIds.length > 1) {
        const newColumns = [...columns]
        const sourceColumn = newColumns.find(column => column.id === sourceDroppableId)
        if (!sourceColumn) {
          alert('cannot find target column')
          return;
        }

        const sourceItems = sourceColumn.items
        const destColumn = newColumns.find(column => column.id === destDroppableId);
        const destItems = destColumn.items
        if (!destColumn) {
          return;
        }
        // // 다중 선택된 아이템들을 sourceItem에서 filtering
        const selectedItemsData = sourceItems.filter(item => selectedItemIds.includes(item.id))

        const newArray = []

        const filteredSourceItems = sourceItems.filter(item => {
          if(!selectedItemsData.includes(item)) {
            return newArray.push(item)
          } else {
            return false
          }
        })


        console.log('wwww',filteredSourceItems)
        console.log('swww',selectedItemsData)


        // const isDraggingDown = destIndex > sourceIndex; //드래그 방향에 따라 index처리가 달라지긴하는데,,        

        // draggableId와 같은 itemId를 가진 배열을 맨 앞으로두고, 나머지는 뒤로 배치
        let draggableItem
        const newSelectedItemsData = []
        selectedItemsData.filter(item => {
          if(item.id === draggableId) {
            draggableItem = item
          } else {
            newSelectedItemsData.push(item)
          }
        })
        newSelectedItemsData.unshift(draggableItem)
        

        // destItems.splice(destIndex, 0, newSelectedItemsData)
        
        console.log(destItems)
        console.log(sourceItems)
        console.log(filteredSourceItems)
        // newSelectedItemsData.forEach((item, index) => {
        //   // const insertIndex = isDraggingDown ? destIndex  : destIndex + index;
        //   // sourceItems.splice()
        //   filteredSourceItems.splice(destIndex + index, 0, item);
        //   console.log('push')

        // });
        destItems.splice(destIndex, 0 ,...newSelectedItemsData)

        // sourceColumn.items = filteredSourceItems;    

        setColumns(newColumns)
      }

      const newColumns = [...columns]
      const sourceColumn = newColumns.find(column => column.id === sourceDroppableId)
      if (!sourceColumn) {
        alert('cannot find target column');
        return;
      }

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
        return; // 따라서 이 상태에서 배열 복구 없이 return만 한다면 원본 배열에서 splicedItems이 사라진 상태로 업데이트됨.
      }

      destItems.splice(destIndex, 0, splicedItems[0])

      setColumns(newColumns)

    }


  }



  const onDragStart = (start) => {
    setContainerBlocked(false)
    console.log(start.draggableId)
    setItemBlocked(false)
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

    const newColumns = [...columns];
    const sourceColumn = newColumns.find(column => column.id === sourceDroppableId);
    const destColumn = newColumns.find(column => column.id === destDroppableId);
    const sourceItems = [...sourceColumn.items]
    const slicedItems = sourceItems[sourceIndex] // splice는 원본 배열에 영향을 주므로 slice로 복사본 만듬
    const destItems = [...destColumn.items]

    //같은 컬럼에서 짝수아이템이 다른 짝수 아이템 앞으로 갈 경우
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
    //같은 컬럼에서 짝수아이템이 다른 짝수 아이템 앞으로 갈 경우    
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
    <div style={{ display: 'flex' }}>
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
                          isDragDisabled={!selectedItemIds.includes(item.id) && selectedItemIds.length !== 0} >
                          {(provided, snapshot) => (
                            <>
                              <DraggableItem
                                $selected={selectedItemIds.includes(item.id)}
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
                                $isDragging={snapshot.isDragging}
                                $itemBlocked={itemBlocked && snapshot.isDragging}
                                style={provided.draggableProps.style}
                              >
                                {item.content}
                              </DraggableItem>
                            </>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* 단일 아이템 추가 버튼 */}
                      <button
                        onClick={() => {
                          const newColumns = [...columns]

                          if (!column.items || !Array.isArray(column.items)) { // 예외처리
                            column.items = []
                          }

                          const newColumnItem = getItem(index + 1, column.items[column.items.length - 1].number)
                          column.items.push(newColumnItem)

                          setColumns(newColumns)

                        }}
                      >+</button>
                    </ItemContainer>
                  )}
                </Droppable>
              </>
            )

          })}
        </div>
      </DragDropContext>

      {/* 새로운 컬럼 생성 버튼 */}
      <button
        onClick={() => {
          const newItems = []
          const newColumn = {
            id: generateColumnId(),
            items: newItems
          }

          const newColumns = [...columns, newColumn]
          setColumns(newColumns)
        }}
        style={{ padding: '40px', fontSize: '100px' }}>
        +</button>
    </div>


  );
}


ReactDOM.render(<App />, document.getElementById("root"));
