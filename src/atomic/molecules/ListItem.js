import React from 'react'
import styled from 'styled-components'

const BaseItem = styled.div`
    cursor : pointer;
    padding : 16px;
    border-radius : 6px;
    margin : 0 0 8px 0;
    border: 1px solid transparent;
`


export const DraggableItem = styled(BaseItem)`
  position: relative;
  user-select: none;
  border: 1px solid #C8E6C9;
  background: #E8F5E9;
  
  color: #333333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover{
    transform: translateY(-5px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
`

export const AddItemButton = styled(BaseItem)`
  cursor : pointer;
  text-align : center;
  background : transparent;
  border-color : white;
  color : #8D6E63; 
  &:hover{
      border: 1px dashed rgba(0,0,0,0.3);
    }

`

const DraggableItem1 = (props) => {
    const {
        provided,
        onClick,
        selectedItemLength,
        content,
        isDraggingItem
        
    } = props
    return(
    <DraggableItemWrap
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

        style={getItemStyle(provided.draggableProps.style, selectedItemIds, item.id, currentDraggingId, itemBlocked, containerBlocked)}
    >
        {selectedItemIds.length > 1 && currentDraggingId === item.id && (
            <SumOfSelectedItems>
                {selectedItemIds.length}
            </SumOfSelectedItems>
        )}
        {item.content}

        {currentDraggingId === item.id && (containerBlocked || itemBlocked) && (
            <MessageBox $deniedMessage={containerBlocked || itemBlocked}>
                {containerBlocked
                    ? "🚫 첫 번째 칼럼에서 세 번째 칼럼으로는 이동할 수 없습니다."
                    : "🚫 짝수 아이템은 다른 짝수 아이템 앞으로 이동할 수 없습니다."}
            </MessageBox>
        )}

    </DraggableItemWrap>
    )
}