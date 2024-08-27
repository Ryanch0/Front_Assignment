import React from 'react'
import styled from 'styled-components'


const BaseColumn = styled.div`
  padding : 16px;
  width: 230px;
  margin-left : 10px;
  margin-right: 10px;
  border-radius: 12px;
  height: 100%;
  overflow-y: auto;
  border: 1px solid #D1D1D1;

`

export const Column = styled(BaseColumn)`
  background: ${props => props.$isDraggingOver ? '#C8E6C9' : '#FFFFFF'};
  &::-webkit-scrollbar {
  display: none;
  }
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */


  ${props => props.$containerBlocked && `
    background : #FFCDD2;
    border : #EF9A9A;
  `}
  
`

export const AddColumnButton = styled(BaseColumn)`
  text-align: center;
  font-size: 24px;
  line-height: 1.4;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #6D4C41;
  cursor: pointer;
  
  
  &:hover {
    background: white;
    /* color: #FFFFFF; */
  }
  
`