import React from 'react'
import glamorous from 'glamorous'
import ScrollToTop from 'react-scroll-up'

const Div = glamorous.div({
  position: 'fixed',
  bottom: '10px',
  right: '10px',
  width: '40px',
  height: '40px',
  backgroundColor: '#bf79db',
  lineHeight: '40px',
  fontSize: '25px',
  textAlign: 'center',
  opacity: '0.5',
  cursor: 'pointer',
  transition: '0.2s',
  ':hover': {
    opacity: '0.75',
  }
})

class ScrollUp extends React.Component {
  render() {
    return (
        <ScrollToTop showUnder={160}>
            <Div>△</Div>
        </ScrollToTop>
    )
  }
}

export default ScrollUp
