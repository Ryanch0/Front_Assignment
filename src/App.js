import React, { useState, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styled from "styled-components";
import { AddItemButton, DraggableItem } from "./atomic/molecules/ListItem";
import { AddColumnButton, Column } from "./atomic/molecules/Columns";
import { generateColumnId, generateColumnItemId, insertColumnIds, insertColumnItemIds, resetAllSets } from "./utils/uuid";
import Toast from "./atomic/molecules/Toast";

const SAVED_COLUMN_DATA = 'SAVED_COLUMN_DATA'

// style
const ContainerWrap = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 82px);
  padding: 20px;
  /* width: 100%; */
  overflow: auto;
  background: #F5F5F5;
`

const SumOfSelectedItems = styled.div`
  position: absolute;
  right: 0;
  top : 0;
  bottom: 20;
  width: 25px;
  height: 25px;
  background: #FF6F61;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 50%;
`

const MessageBox = styled.div`
  position: absolute;
  left : 0;
  bottom : -27px;
  padding: 4px 8px;
  color: #D64550;
  border: 1px solid #D8DEE3;
  border-radius: 8px;
  font-weight: bold;
  background: ${props => props.$deniedMessage ? '#F2F5F7' : '#E1F7DF'};
  font-family: sans-serif;
  font-size: 15px;
  width: 400px;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  background-color: #e6f7f7; 
  padding: 20px;
  text-align: center;
  border-bottom: 2px solid #b2dfdb;
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 26px;
  color: #00796b;
  margin: 0;
`;

const SaveButton = styled.button`
  cursor: pointer;
  margin-left: 4px;
  padding: 12px;
  border-radius: 8px;
  background: white;
  
  
  color: #333;
  border: 1px solid #C8E6C9;
  /* margin-left: 12px; */
`

function App() {
  // 조건문이 복잡해서 따로 style을 return 하는 getItemStyle() 사용. useCallback의 사용 이유는 성능 최적화 때문.
  // getItemStyle()은 복잡한 조건문이 여러개 있고, 렌더링 시 반복적으로 호출될 수 있기 때문에
  // 마지막인자 []은 의존성배열이므로 해당 함수는 컴포넌트의 생애 주기에 한번만 생성됨
  const getItemStyle = useCallback((basicStyle, selectedItemIds, itemId, currentDraggingId, itemBlocked, containerBlocked) => {
    if (currentDraggingId == itemId && containerBlocked) {
      return {
        ...basicStyle, // 여기서 basicStyle은 beautiful dnd가 기본적으로 제공하는 스타일을 사용함 (provided.draggableProps.style을 받아옴)
        background: '#FFCDD2',
        border: '1px solid #EF9A9A',
        opacity: 0.9,
      }
    }
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
    if (selectedItemIds.includes(itemId)) { // 다중선택한 아이템이 컬럼아이템에 존재할경우
      if (currentDraggingId && currentDraggingId !== itemId) { //드래그한 아이템이 존재하며, 다중 선택 아이템중 드래그한 아이템이 아닐경우
        return {
          ...basicStyle,
          background: '#B3E5FC',
          color: '#0288D1',
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


  // 아이템 배열 생성
  const getItems = (num, count) =>
    Array.from({ length: count }, (num, k) => k).map((k) => ({
      id: generateColumnItemId(), // 유니크한 key값을 가지도록 id생성
      content: `List${num} Item${k + 1}`,
      number: k + 1 // 짝수인지, 홀수인지 판단하기 위해 number라는 키를 부여함. 0부터 시작하는 인덱스를 1부터 시작시키도록 +1
    }));

  // 단일 아이템 추가
  const getItem = (num, count) => {
    return {
      id: generateColumnItemId(),
      content: `List${num} Item${count + 1}`,
      number: count + 1
    }
  }

  const [containerBlocked, setContainerBlocked] = useState(false) // 첫번째 컬럼 -> 세번째 컬럼 block
  const [itemBlocked, setItemBlocked] = useState(false) // 아이템 이동 불가 block
  const [selectedItemIds, setSelectedItemIds] = useState([]) // 다중 선택시 선택된 아이템의 Ids
  const [currentColumn, setCurrentColumn] = useState(null)
  const [currentDraggingId, setCurrentDraggingId] = useState('')
  const [columns, setColumns] = useState([])

  const [toastText, setToastText] = useState(null) // 데이터 저장 및 초기화 할때 메세지를 띄워주는 용도. toastText값으로 메시지를 표기 ({toastText && (<Toast>{toastText}</Toast>)})

  const openToast = (text) => {
    setToastText(text) // 토스트 메시지 상태 업데이트
    setTimeout(() => setToastText(null), 2000) // 토스트 메시지 2초 후 삭제 -> null
  }

  
  const onClickSaveButton = () => {
    window.localStorage.setItem(SAVED_COLUMN_DATA, JSON.stringify(columns)) // SAVED_COULMN_DATA라는 key값으로 localStorage에 columns데이터를 JSON으로 변환시켜서 저장한다
    openToast('데이터가 저장되었습니다') // 데이터 저장시 보여 줄 토스트 문구
  }

  const onClickResetButton = () => {
    window.localStorage.removeItem(SAVED_COLUMN_DATA) // 저장한 데이터를 localStorage에서 키값 삭제
    setupDefaultColumns() // 초기 컬럼값으로 되돌림
    openToast('데이터가 초기화되었습니다') // 초기화 토스트 문구
  }

  // 드래그를 Drop했을때 발생하는 이벤트
  const onDragEnd = (result) => { // 라이브러리에서 result라는 인자를 통해 destination, source, draggableId를 제공함
    setCurrentDraggingId(null)
    if (!result.destination || !result.source) { // 언제나 예외처리, 데이터가 없을 경우 페이지가 터지니까
      return;
    }

    const {
      destination,
      source,
      draggableId //드래그 하는 아이템의 id에 해당함
    } = result // 구조분해할당으로 result 객체의 변수 선언 (편의성)
    console.log(result)
    const { droppableId: destDroppableId, index: destIndex } = destination // 마찬가지로 구조분해할당으로 destination, source가 가진 객체 변수 선언 (편의성)
    const { droppableId: sourceDroppableId, index: sourceIndex } = source // 구조분해할당

    // setSelectedItems([]) // drop후 다중선택 초기화

    // 같은 DroppableId 내에 있는 경우
    if (sourceDroppableId === destDroppableId) { // column의 id값에 해당함
      const newColumns = [...columns] // 얕은 복사를 통해 새로운 변수를 만들었음. 하지만 결과적으로 columns내부 데이터들이 바뀔거라 원본 데이터를 보호하지 못함.
                                      //  애초에 이 프로젝트에서 원본데이터 유지의 중요성조차 없음. 깊은 복사까지 갈 필요도 없고, 얕은 복사조차 사실 무의미함.
                                      // 그렇다면 왜? 얕은 복사를 진행한것인가? => "불변성을 지키려는 개발자의 일종의 관습에 불과함."

      const sourceColumn = newColumns.find(column => column.id === sourceDroppableId) // 드래그를 Drop했을 때 컬럼아이디가 같은 source컬럼을 찾아옴
      if (!sourceColumn) {
        alert('cannot find target column')
        return; // 예외처리
      }

      // 같은 컬럼에서 다중 아이템 이동 (2개 이상)
      if (selectedItemIds.length > 1) {

        const finalDestIndex = sourceIndex < destIndex ? destIndex + 1 : destIndex // sourceIndex < destIndex 경우(드래그를 아래로) 한칸씩 뒤의 아이템들이 앞당겨지므로 destIndex + 1을 해야함
                                                                                   // sourceIndex > destIndex 경우(드래그를 위로) 아이템들의 인덱스 변화 x
                                                                                   // 그렇다면 sourceIndex < destIndex일때 단일 아이템은 왜 destIndex + 1처리를 안하는가? => 단일 아이템은 하나의 아이템이 제거되고 정확한 위치에 채워지기때문에 인덱스 조정이 필요없음

        const sourceItems = sourceColumn.items
        
        const selectedItems = [] // 선택된 아이템 변수
        const filteredSourceItems = sourceItems.filter(item => {
          if (selectedItemIds.includes(item.id)) {
            selectedItems.push(item)         
            return false
          } else {
            return true       // 선택된 아이템 이외의 아이템을 위한 변수
          }
        })

        // 선택된 sorting
        let draggableItem // drag하는 아이템 변수 선언
        const sortedSelectedItems = [] // 다중 선택 아이템 변수 선언
        selectedItems.forEach(item => {
          if (item.id === draggableId) { 
            draggableItem = { ...item, moved: true } // 다중 선택 중 드래그 하는 아이템 변수 할당 (...item을 쓴거는 좋은 관습 원본 배열 보호 목적의 관습), moved : true라는 이동하는 아이템이라는 속성을 임의로 부여
          } else {
            sortedSelectedItems.push({ ...item, moved: true }) // 드래그에 해당하지 않는 나머지 아이템들

          }
        })
        sortedSelectedItems.unshift(draggableItem) // unshift를 사용함으로써 배열의 순서에 draggableItem이 최우선으로 당겨짐

        // 다중 아이템 이동 중 짝수 아이템 이동불가 처리
        if (draggableItem?.number % 2 === 0 &&
          sourceItems[finalDestIndex]?.number % 2 === 0 // 아이템의 number속성을 기준으로 홀수, 짝수 판별해서 드래그한 아이템과 drop하는 자리의 아이템의 number를 비교
        ) {
          setItemBlocked(false)   // 이건 드래그하는 중에 예외 css를 입히기 위한것으로 onDragEnd할때는 false로 바꿔줘야함

          setSelectedItemIds([]) // 다중 선택 배열 초기화
          return; // 실행 중단
        }

        // 다중 아이템 이동
        sourceItems.splice(finalDestIndex, 0, ...sortedSelectedItems) // finalDestIndex자리에 다중선택 아이템들 추가시킴 (교체가 아닌, 추가의 개념)

        sourceColumn.items = sourceItems.reduce((acc, item) => { // 기존 선택한 아이템은 이동했다고보고 필터링을 해야함
          if (selectedItemIds.includes(item.id)) { // reduce메서드에서 요소들이 한번씩 돌때, 다중선택한 아이템id에 포함될때 moved속성이 없다면 (기존배열) return acc; 그냥 pass (acc에 추가 안함)
            if (!item.moved) {                    
              console.log(acc)
              return acc
            }
            delete item.moved                      // moved속성이 있을경우(다중 선택한 아이템배열) moved속성은 더이상 필요없으니 삭제 -> acc에 push
          }
          acc.push(item)                           // 다중 선택에 해당하지 않는 요소들은 그냥 push
          return acc
        }, [])                                     // acc의 초깃값은 빈 배열로 시작. 다중 아이템의 이동이 완료되고 sourceColumn.items의 배열을 새로 교체
        setColumns(newColumns)                     // 모든 최상위 state인 컬럼을 최종적으로 update, 사실 이미 원본배열이 바뀌어서(splice, reduce) 없어도 되지만 안정성의 보장 및 관습적으로 꼭 해줘야함
        setSelectedItemIds([])                     // 다중이동 끝난 후에 다중 선택state 초기화

        return;                                    // 함수의 종료 명시, 사실 이후의 로직이 없어서 return; 표기하지 않아도 됨. 하지만 명확성을 위해 표기
      } 
      // 동일 컬럼 이동 내에 다중 이동이 아닌경우, 단일 이동
      else {        
        const sourceItems = sourceColumn.items  
        const splicedItems = sourceItems.splice(sourceIndex, 1) // sourceIndex(선택인덱스) 자리의 1개의 요소 제거, 새로운 배열에 할당
        const destColumn = newColumns.find(column => column.id === destDroppableId); // 동일 컬럼이라 사실상 sourceColumn 으로 처리해도 무방
        const destItems = destColumn.items
        if (!destColumn) {
          return; // 예외처리
        }

        // console.log(destItems.length) // 실제 길이는 10이지만, 9가 나오는 이유 : splicedItems로 인해 배열의 변화가 일어남

        // 단일 아이템 이동에서의 짝수 아이템은 다른 짝수 아이템 앞으로 이동 불가
        if (splicedItems[0].number % 2 === 0 &&
          destIndex < destItems.length &&  // destItems.length가 줄어들었기 때문에(splicedItems) 마지막 인덱스 이상으로 접근 못하게 함
          destItems[destIndex].number % 2 === 0
        ) {
          setItemBlocked(false) // drag끝난 뒤 state초기화
          sourceItems.splice(sourceIndex, 0, splicedItems[0]) // 짝수 아이템 예외처리에서 다시 원본 배열상태로 되돌려놓아야함. 이미 원본 배열이 수정됐기 때문
          return; // 따라서 이 상태에서 배열 복구 없이 return만 한다면 원본 배열에서 splicedItems이 사라진 상태로 업데이트됨.
        }

        sourceItems.splice(destIndex, 0, splicedItems[0]) // 제약 조건 없이 최종 단일 아이템의 이동, destIndex에 아무런 요소를 제거하지 않고(0) 아까 제외시킨 아이템의 추가
        setColumns(newColumns) // 최종 colums상태 업데이트
        setSelectedItemIds([]) // 단일 아이템을 선택후(선택해도 다중아이템 state에 한개 추가됨) 이동하는 경우에도 이동이 끝나고 어쨌든 비워줘야함

      }
    }


    // 다른 컬럼(DroppableId) 간의 이동일 경우
    else if (destDroppableId !== sourceDroppableId) {
      // 첫번째 컬럼에서 세번째 컬럼으로 이동 불가 제약 조건 처리
      if (columns.length >= 3) { // 먼저 컬럼의 갯수가 최소 3개이상이어야함
        if (sourceDroppableId == columns[0].id && destDroppableId == columns[2].id) {
          setContainerBlocked(false) // drag끝난 뒤 state 초기화
          setSelectedItemIds([]) // 다중아이템일 경우 state 초기화
          return; // 이 부분은 단순 조건 검사이기 때문에 특정 조건에서 drop을 아예 차단하고 있기 때문
        }
      }

      const newColumns = [...columns]
      const sourceColumn = newColumns.find(column => column.id === sourceDroppableId)
      if (!sourceColumn) {
        alert('cannot find target column')
        return;
      }

      const sourceItems = sourceColumn.items
      const destColumn = newColumns.find(column => column.id === destDroppableId)
      if (!destColumn) {
        return;
      }
      const destItems = destColumn.items


      // 다른컬럼으로 다중아이템 이동 (2개이상)
      if (selectedItemIds.length > 1) {
        const finalDestIndex = sourceIndex < destIndex ? destIndex + 1 : destIndex
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
            draggableItem = { ...item };  // 여기서는 moved라는 속성을 주지 않았음, 배열의 변화는 sourceColumn이 아닌 destColumn에서 일어날것이기때문에 
            return false;
          }
          return true;
        });

        sortedSelectedItems.unshift(draggableItem) // 다중 선택 배열의 정렬

        // 다중 아이템 이동 중 짝수 아이템 이동불가 처리
        if (draggableItem?.number % 2 === 0 &&
          destItems[destIndex]?.number % 2 === 0
        ) {
          setItemBlocked(false)
          setSelectedItemIds([])
          return;
        }


        destItems.splice(finalDestIndex, 0, ...sortedSelectedItems) // destItems배열에 다중 선택 아이템들 추가
        sourceColumn.items = filteredSourceItems // 동일 컬럼에서의 다중 이동과 다르게 여기서는 sourceColumn을 선택되지 않았던 아이템들로 단순 배열 교체시킴
        setColumns(newColumns)
        setSelectedItemIds([])
        return;
      }
      // 다른 컬럼간 이동 중 단일 이동
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

        // 짝수 아이템은 다른 짝수 아이템 앞으로 이동 불가
        if (splicedItems[0].number % 2 === 0 &&
          destIndex < destItems.length &&  // destItems.length가 줄어들었기 때문에 마지막 인덱스 이상으로 접근 못하게 함
          destItems[destIndex].number % 2 === 0) {
          sourceItems.splice(sourceIndex, 0, splicedItems[0]) //splicedItems는 원본 배열(newColums)에서 빠진 상태. splice()는 원본을 수정한다.
          return; // 따라서 이 상태에서 배열 복구 없이 return만 한다면 원본 배열에서 splicedItems이 사라진 상태로 업데이트됨.
        }

        destItems.splice(destIndex, 0, splicedItems[0])

        setColumns(newColumns)
        setSelectedItemIds([])
      }

    }
  }

  // 드래그를 시작했을때 처음 발생하는 이벤트
  const onDragStart = (start) => {
    setContainerBlocked(false)
    setItemBlocked(false)

    if (!start.source) {
      return  // 예외처리
    }

    const {
      source,
      draggableId
    } = start // 구조분해 할당

    const { droppableId: sourceDroppableId, index: sourceIndex } = source // 구조분해할당으로 선언해놨지만 안썼음

    setCurrentDraggingId(draggableId) // 드래그 중인 아이템의 id를 state에 저장
  }


  // 드래그 중(ing) 발생하는 이벤트,  예외처리 css처리 함수
  const onDragUpdate = (result) => {
    if (!result.destination || !result.source) {
      return; // 예외처리
    }

    const { destination,
      source
    } = result

    const { droppableId: destDroppableId, index: destIndex } = destination
    const { droppableId: sourceDroppableId, index: sourceIndex } = source

    if (columns.length >= 3) {
      if (sourceDroppableId == columns[0].id && destDroppableId == columns[2].id) {
        setContainerBlocked(true) // 첫째 컬럼에서 세번째 컬럼으로 이동하는 중에 css 예외처리 발생
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

    // 동일 컬럼 간 짝수 제약 조건
    if (sourceDroppableId === destDroppableId) {
      const isDraggingDown = destIndex > sourceIndex // 드래그 방향에 따라 destItems[destIndex].number가 바뀜
      const adjacentIndex = isDraggingDown ? destIndex + 1 : destIndex // 아랫방향일경우와 윗방향일 경우, 사실 위에 onDragEnd에서 명시한 finalDestIndex와 동일함

      if (
        slicedItems.number % 2 === 0 &&
        adjacentIndex >= 0 &&
        adjacentIndex < destItems.length &&
        destItems[adjacentIndex]?.number % 2 === 0 // 드래그 방향에 따라 dest아이템이 짝수인지 아닌지 판단
      ) {
        setItemBlocked(true) // 짝수 제약조건 css 활성화
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

  // 성능 최적화 useCallback사용 
  const onClickItem = useCallback((currentColumn, columnId, itemId, selectedItemIds) => {
    if (currentColumn !== columnId) { // 다중 선택은 같은 컬럼 내에서만 가능
      setCurrentColumn(columnId) // currentColumn은 기본적으로 null 이므로 일단 클릭하면 추가
      setSelectedItemIds([itemId]) // selectedItemIds의 타입은 Array
    }
    else { // 같은 컬럼일경우
      if (!selectedItemIds.includes(itemId)) { // 새로 추가하는경우
        setSelectedItemIds([...selectedItemIds, itemId])
      } else {
        const newSelectedItems = selectedItemIds.filter(x => x !== itemId) // 기존에 있던거 재 클릭하면 삭제
        setSelectedItemIds(newSelectedItems)
      }
    }
  }, []) // 랜더링 시에 한번만 함수 호출

  // 아이템 추가 버튼, 흠이 많은 로직임 아이템에 부여되는 번호에 대해 예외처리 부족한 상태로 마무리 됨
  const addItemButton = (columnIndex) => {
    const newColumns = [...columns]
    const column = newColumns[columnIndex]
    if (!column.items || !Array.isArray(column.items)) { // 예외처리
      column.items = []
    }
    if (column.items.length === 0) { // 빈 컬럼일경우
      const newColumnItem = getItem(columnIndex + 1, 0)
      column.items.push(newColumnItem)
    } else { // 기존의 아이템이 존재하던 컬럼 일경우
      const newColumnItem = getItem(columnIndex + 1, column.items[column.items.length - 1].number)
      column.items.push(newColumnItem)
    }
    setColumns(newColumns)
  }

  // 초기 Columns값 설정
  const setupDefaultColumns = () => {
    resetAllSets()
    setColumns([
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
  }

  // 로컬스토리지에 저장한 columns값을 불러오기 위한 함수
  const initializeColumns = () => {
    try {
      const savedColumnStr = window.localStorage.getItem(SAVED_COLUMN_DATA)
      if (!savedColumnStr || savedColumnStr === '') {
        throw new Error('저장된 데이터가 없습니다') // 현재 이 error는 try catch로 처리되어 catch에 있는 내용이 아니라 출력이 되지않고있음
      }

      const columns = JSON.parse(savedColumnStr) //JSON형식의 value값을 pasing해서 객체나 배열로 변환 
      const columnIds = []
      const columnItemIds = []
      columns.forEach(column => {
        const {
          items,
          id
        } = column
        columnIds.push(id)
        items.forEach(item => columnItemIds.push(item.id))
      })
      // columnIds와 columnItemIds를 Set 자료형으로 추가 (후에 추가될 다른 id들과 중복을 피하기 위함)
      insertColumnIds(columnIds)
      insertColumnItemIds(columnItemIds)
      setColumns(columns) //최종적으로 columns 상태 업데이트

    } catch (e) {
      setupDefaultColumns() //저장된 값이 없으면 초기 컬럼값 설정
    }
  }

  // 처음 랜더링할때 한번 실행
  useEffect(() => {
    initializeColumns()

  }, [])

  return (
    <>
      <Header>
        <Title>
          Drag & Drop Item Management
        </Title>
        <div>
          <SaveButton onClick={onClickResetButton}>초기화</SaveButton>
          <SaveButton
            onClick={onClickSaveButton}
            style={{ background: '#00796b', color: 'white' }}
          >저장</SaveButton>
        </div>
      </Header>
      <ContainerWrap>
        <DragDropContext onDragUpdate={onDragUpdate} onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <div style={{ display: 'flex' }}>
            {columns?.map((column, columnIndex) => {
              if (!column) {
                return;
              }
              const {
                id: columnId,
                items
              } = column
              return (
                <>
                  <Droppable droppableId={columnId} isDropDisabled={!selectedItemIds}>
                    {(provided, snapshot) => (
                      <Column
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        $isDraggingOver={snapshot.isDraggingOver}
                        $containerBlocked={containerBlocked && snapshot.isDraggingOver}
                      >
                        {items?.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}
                            // 단일 아이템은 단일 드래그 가능, 그 외는 다중 선택 후 이동 시켜야 함.
                            isDragDisabled={!selectedItemIds?.includes(item.id) && selectedItemIds.length !== 0} >
                            {(provided, snapshot) => {
                              const isDraggingItem = currentDraggingId === item.id
                              const isBlocked = containerBlocked || itemBlocked
                              return (
                                <DraggableItem
                                  // 다중 드래그 선택 onClick
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onClickItem(currentColumn, columnId, item.id, selectedItemIds)}
                                  style={getItemStyle(provided.draggableProps.style, selectedItemIds, item.id, currentDraggingId, itemBlocked, containerBlocked)}
                                >
                                  {selectedItemIds.length > 1 && isDraggingItem && (
                                    <SumOfSelectedItems>
                                      {selectedItemIds.length}
                                    </SumOfSelectedItems>
                                  )}
                                  {item.content}

                                  {isDraggingItem && isBlocked && (
                                    <MessageBox $deniedMessage={isBlocked}>
                                      {containerBlocked
                                        ? "🚫 첫 번째 칼럼에서 세 번째 칼럼으로는 이동할 수 없습니다."
                                        : "🚫 짝수 아이템은 다른 짝수 아이템 앞으로 이동할 수 없습니다."}
                                    </MessageBox>
                                  )}

                                </DraggableItem>
                              )
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* 단일 아이템 추가 버튼 */}
                        <AddItemButton
                          onClick={() => addItemButton(columnIndex)}
                        >
                          + Add Item
                        </AddItemButton>
                      </Column>
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
              + <br />Add Column</AddColumnButton>
          </div>
        </DragDropContext>
      </ContainerWrap>
      {
        toastText && (
          <Toast>{toastText}</Toast>
        )
      }
    </>
  );
}



export default App