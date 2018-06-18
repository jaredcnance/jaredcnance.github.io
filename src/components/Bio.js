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
            marginTop: rhythm(0.9),
            width: rhythm(5),
            height: rhythm(5),
            borderRadius: '50%',
          }}
        />
        <p>
          My name is <strong>Jared Nance</strong>, I live and work in Kansas
          City. I enjoy building things and sharing what I learn along the way.{' '}
          You can follow me on{' '}
          <a href="https://twitter.com/jaredcnance">Twitter</a> or{' '}
          <a href="https://github.com/jaredcnance">GitHub</a>
        </p>
      </div>
    )
  }
}

export default Bio
