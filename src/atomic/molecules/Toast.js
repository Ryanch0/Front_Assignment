import React from 'react'
import styled, { keyframes } from 'styled-components'
const ToastKeyframes = keyframes`
  0% {
    opacity: 0;
  }
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`
const Toast = styled.div`
  position: fixed;
  border-radius : 8px;
  top: 10px;
  left: 50%;
  font-size: 14px;
  padding: 8px 12px;
  transform: translateX(-50%);
  background-color: rgba(0,0,0,0.6);
  color: white;

  animation: ${ToastKeyframes} 1.2s forwards;

`
export default Toast