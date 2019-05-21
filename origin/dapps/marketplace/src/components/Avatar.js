import React from 'react'
import makeGatewayUrl from 'utils/makeGatewayUrl'
import withConfig from 'hoc/withConfig'

const Avatar = ({
  size,
  avatar,
  avatarUrl,
  profile,
  config,
  className,
  emptyClass = 'empty'
}) => {
  const props = { style: {}, className: 'avatar' }
  if (size) {
    props.style = { width: size || 50, paddingTop: size || 50 }
  }
  let httpAvatar = undefined
  if (avatarUrl && config) {
    const { ipfsGateway } = config
    httpAvatar = makeGatewayUrl(ipfsGateway, avatarUrl)
  } else if (profile && profile.avatarUrlExpanded) {
    httpAvatar = profile.avatarUrlExpanded
  } else if (avatar) {
    httpAvatar = avatar
  }

  if (!httpAvatar) {
    props.className += ` ${emptyClass}`
  } else {
    props.style.backgroundImage = `url(${httpAvatar})`
  }

  if (className) {
    props.className += ` ${className}`
  }

  return <div {...props} />
}

export default withConfig(Avatar)

require('react-styl')(`
  .avatar
    position: relative
    width: 100%
    padding-top: 100%
    background-size: contain
    border-radius: var(--default-radius)
    background-repeat: no-repeat
    background-position: center

    &.empty
      background: var(--dark-grey-blue) url(images/avatar-blue.svg) no-repeat center bottom;
      background-size: 63%
      &.dark
        background: var(--dark-two) url(images/avatar-unnamed.svg) no-repeat center bottom;
        background-size: 63%
    &.camera
      background: var(--dark-two) url(images/camera-icon.svg) no-repeat center;
    &.with-cam::after
      content: ""
      width: 2rem
      height: 2rem
      background: url(images/camera-icon-circle.svg) no-repeat center
      background-size: 100%
      position: absolute
      bottom: 0.3rem
      right: 0.3rem

`)
