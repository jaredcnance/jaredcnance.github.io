import React from 'react'

// Import typefaces
import 'typeface-montserrat'
import 'typeface-merriweather'

import profilePic from './profile-pic.png'
import { rhythm } from '../utils/typography'

class Bio extends React.Component {
  render() {
    return (
      <div
        style={{
          display: 'flex',
          marginBottom: rhythm(2.5),
        }}
      >
        <img
          src={profilePic}
          alt={`jaredcnance`}
          style={{
            marginRight: rhythm(1 / 2),
            marginBottom: 0,
            width: rhythm(2),
            height: rhythm(2),
          }}
        />
        <p>
          My name is <strong>Jared Nance</strong>, I live and work in Kansas
          City. I enjoy building things and sharing what I learn along the way.{' '}
          You can{' '}
          <a href="https://twitter.com/jaredcnance">follow me on Twitter</a> or{' '}
          <a href="https://github.com/jaredcnance">GitHub</a>
        </p>
      </div>
    )
  }
}

export default Bio