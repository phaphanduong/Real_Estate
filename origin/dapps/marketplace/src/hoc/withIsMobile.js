import React, { Component } from 'react'

function withIsMobile(WrappedComponent) {
  return class WithIsMobile extends Component {
    constructor(props) {
      super(props)
      this.onResize = this.onResize.bind(this)
      this.state = {
        isMobile: false
      }
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.onResize)
    }

    componentDidMount() {
      window.addEventListener('resize', this.onResize)
      this.onResize()
    }

    onResize() {
      if (window.innerWidth < 767 && !this.state.isMobile) {
        this.setState({ isMobile: true })
      } else if (window.innerWidth >= 767 && this.state.isMobile) {
        this.setState({ isMobile: false })
      }
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          ismobile={this.state.isMobile ? 'true' : 'false'}
        />
      )
    }
  }
}

export default withIsMobile
