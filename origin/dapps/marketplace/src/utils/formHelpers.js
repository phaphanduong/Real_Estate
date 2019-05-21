import React from 'react'

export const formInput = (state, setState, className) => (
  field,
  valueOnly
) => ({
  value: state[field] || '',
  className: `form-control form-control-lg${
    state[`${field}Error`] ? ' is-invalid' : ''
  }${className ? ` ${className}` : ''}`,
  name: field,
  onChange: e =>
    setState({
      [field]: valueOnly ? e : e.target.value,
      [`${field}Error`]: false
    })
})

export const formFeedback = state =>
  function InvalidFeedback(field) {
    return state[`${field}Error`] ? (
      <div className="invalid-feedback" style={{ display: 'block' }}>
        {state[`${field}Error`]}
      </div>
    ) : null
  }
