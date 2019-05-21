import React, { Component } from 'react'
import { Query } from 'react-apollo'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

import withWallet from 'hoc/withWallet'

import Link from 'components/Link'
import BottomScrollListener from 'components/BottomScrollListener'
import NavLink from 'components/NavLink'
import QueryError from 'components/QueryError'
import Redirect from 'components/Redirect'
import DocumentTitle from 'components/DocumentTitle'

import NotificationRow from './NotificationRow'

import nextPageFactory from 'utils/nextPageFactory'
import query from 'queries/UserNotifications'

const nextPage = nextPageFactory('marketplace.user.notifications')

const NavPills = () => (
  <ul className="nav nav-pills flex-column">
    <li className="nav-item">
      <NavLink
        className="nav-link"
        to="/notifications"
        exact
        children={fbt('All', 'All')}
      />
    </li>
    {/* TODO: Re-enable filters
    <li clas sName="nav-item">
      <NavLink className="nav-link" to="/notifications/all" children={fbt("All", "All")} />
    </li>
    <li className="nav-item">
      <NavLink className="nav-link" to="/notifications/buy" children={fbt("Buy", "Buy")} />
    </li>
    <li className="nav-item">
      <NavLink className="nav-link" to="/notifications/sell" children={fbt("Sell", "Sell")} />
    </li>
    */}
  </ul>
)

class Notifications extends Component {
  state = {}
  render() {
    if (this.state.redirect) {
      return <Redirect to={`/purchases/${this.state.redirect.offer.id}`} push />
    }
    const vars = { first: 10, id: this.props.wallet }
    if (!this.props.wallet) return null

    return (
      <div className="container purchases">
        <DocumentTitle
          pageTitle={<fbt desc="notifications.title">Notifications</fbt>}
        />
        <Query
          query={query}
          variables={vars}
          notifyOnNetworkStatusChange={true}
        >
          {({ error, data, fetchMore, networkStatus }) => {
            if (networkStatus === 1) {
              return (
                <h1>
                  <fbt desc="notifications.loading">Loading...</fbt>
                </h1>
              )
            } else if (error) {
              return <QueryError error={error} query={query} vars={vars} />
            } else if (!data || !data.marketplace) {
              return (
                <p className="p-3">
                  <fbt desc="notifications.noMarketplace">
                    No marketplace contract?
                  </fbt>
                </p>
              )
            }

            const { nodes, pageInfo, totalCount } = get(
              data,
              'marketplace.user.notifications'
            )
            const { hasNextPage, endCursor: after } = pageInfo

            if (!totalCount) {
              return <NoNotifications />
            }

            return (
              <BottomScrollListener
                ready={networkStatus === 7}
                hasMore={hasNextPage}
                onBottom={() => nextPage(fetchMore, { ...vars, after })}
              >
                <>
                  <h1>{`${totalCount} Notifications`}</h1>
                  <div className="row">
                    <div className="col-md-3">
                      <NavPills />
                    </div>
                    <div className="col-md-9">
                      <div className="notifications-list">
                        {nodes.map(node => (
                          <NotificationRow
                            key={node.id}
                            node={node}
                            onClick={() => this.setState({ redirect: node })}
                          />
                        ))}
                      </div>
                      {!hasNextPage ? null : (
                        <button
                          children={
                            networkStatus === 3
                              ? fbt('notifications.item.loading', 'Loading')
                              : fbt(
                                  'notifications.item.loadmore',
                                  'Load more...'
                                )
                          }
                          className="btn btn-outline-primary btn-rounded mt-3"
                          onClick={() =>
                            nextPage(fetchMore, { ...vars, after })
                          }
                        />
                      )}
                    </div>
                  </div>
                </>
              </BottomScrollListener>
            )
          }}
        </Query>
      </div>
    )
  }
}

const NoNotifications = () => (
  <div className="row">
    <div className="col-12 text-center">
      <img src="images/empty-listings-graphic.svg" />
      <h1>You don&apos;t have any notifications.</h1>
      <p>Click below to view all listings.</p>
      <br />
      <Link to="/" className="btn btn-lg btn-primary btn-rounded">
        Browse Listings
      </Link>
    </div>
  </div>
)

export default withWallet(Notifications)

require('react-styl')(`
  .notifications-list
    border: 1px solid var(--light)
    border-radius: var(--default-radius)
`)
