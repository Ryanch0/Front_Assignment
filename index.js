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

  ${props => props.$isBlocked && `
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
`

const IndexContainer = styled.div`

`


function App() {

  const getItems = (num, count) =>
    Array.from({ length: count }, (num, k) => k).map((k) => ({
      id: generateColumnItemId(),
      content: `item${num} ${k + 1}`,
    }));

  const [isBlocked, setIsBlocked] = useState(false)

  const [columns, setColumns] = useState([
    {
      id: generateColumnId(),
      items: getItems(1, 10),
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

    const { destination,
      source
    } = result

    const { droppableId: destDroppableId, index: destIndex } = destination
    const { droppableId: sourceDroppableId, index: sourceIndex } = source

    // 1. 같은 DroppableId 내에 있는 경우
    // 1-1. 기존 방식의 splice를 이용한 setItem()
    if (destDroppableId === sourceDroppableId) {
      const newColumns = [...columns]
      const sourceColumn = newColumns.find(column => column.id === destDroppableId)
      if (!sourceColumn) {
        alert('cannot find target column');
        return;
      } 
      // // 4-1. 짝수 아이템은 다른 짝수 아이템 앞으로 이동 불가
      // else if(sourceIndex % destIndex === ) {


      // }

      const sourceItems = sourceColumn.items
      const sourceItem = sourceItems.splice(sourceIndex, 1)
      sourceItems.splice(destIndex, 0, sourceItem[0])
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
          setIsBlocked(false) // drag끝난 뒤 state 초기화
          return;
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
      destItems.splice(destIndex, 0, splicedItems[0])

      setColumns(newColumns)

    }

  }



  const onDragStart = () => {
    setIsBlocked(false)
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
        setIsBlocked(true)
      } else {
        setIsBlocked(false)
      }

    }
  }


  return (
    <div style={{ display: 'flex' }}>
      <DragDropContext onDragUpdate={onDragUpdate} onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div style={{ display: 'flex' }}>
          {columns?.map(column => {
            if (!column) {
              return;
            }
            const {
              id,
              items
            } = column
            return (
              <>
                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <ItemContainer
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      $isDraggingOver={snapshot.isDraggingOver}
                      $isBlocked={isBlocked && snapshot.isDraggingOver}
                    >

                      {items?.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <>
                            <IndexContainer>{index + 1}</IndexContainer>
                            <DraggableItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              $isDragging={snapshot.isDragging}
                              style={provided.draggableProps.style}
                            >
                              {item.content}
                            </DraggableItem>
                            </>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <button
                        onClick={() => {
                          const newColumns = [...columns]
                          const selectedColumn = newColumns.find(column => column.id === id)
                          if (!selectedColumn) {
                            return;
                          }

                          if (!selectedColumn.items || !Array.isArray(selectedColumn.items)) { // 예외처리
                            selectedColumn.items = []
                          }

                          const newColumnItem = {
                            id: generateColumnItemId(),
                            content: 'TestItem'
                          }

                          selectedColumn.items.push(newColumnItem)

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
        style={{ padding: '40px', fontSize: '100px' }}>+</button>
    </div>


  );
}


ReactDOM.render(<App />, document.getElementById("root"));
