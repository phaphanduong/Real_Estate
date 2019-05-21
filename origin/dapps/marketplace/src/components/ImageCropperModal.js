import React, { Component } from 'react'
import ReactCrop from 'react-image-crop'
import { fbt } from 'fbt-runtime'

import Modal from 'components/Modal'

class ImageCropperModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      src: props.src,
      didCrop: false,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    }
  }

  componentDidMount() {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d').drawImage(image, 0, 0)
      canvas.toBlob(blob => {
        blob.name = 'image.jpeg'
        this.setState({ blob, blobUrl: window.URL.createObjectURL(blob) })
      }, 'image/jpeg')
    }
    image.src = this.state.src
  }

  getCroppedImg() {
    const { pixelCrop } = this.state
    const canvas = document.createElement('canvas')
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(
      this.imageRef,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise(resolve => {
      canvas.toBlob(blob => {
        blob.name = 'image.jpeg'
        resolve(blob)
      }, 'image/jpeg')
    })
  }

  render() {
    if (!this.state.blob) {
      return null
    }
    return (
      <Modal
        className="image-cropper-modal"
        shouldClose={this.state.shouldClose}
        onClose={() => this.props.onClose()}
      >
        <>
          <h5>Crop</h5>
          <div style={{ height: 200 }}>
            <ReactCrop
              src={this.state.blobUrl}
              crop={this.state.crop}
              onImageLoaded={image => (this.imageRef = image)}
              onChange={(crop, pixelCrop) =>
                this.setState({ crop, pixelCrop, didCrop: true })
              }
            />
          </div>
          <div className="help-text">Click and drag to crop</div>
          <div className="actions">
            <button
              className="btn btn-outline-light"
              onClick={() => this.setState({ shouldClose: true })}
              children={fbt('Cancel', 'Cancel')}
            />
            <button
              className="btn btn-outline-light"
              onClick={async () => {
                if (this.state.didCrop) {
                  const croppedImageBlob = await this.getCroppedImg()
                  this.props.onChange(croppedImageBlob)
                }
                this.setState({ shouldClose: true })
              }}
              children={fbt('OK', 'OK')}
            />
          </div>
        </>
      </Modal>
    )
  }
}

export default ImageCropperModal
