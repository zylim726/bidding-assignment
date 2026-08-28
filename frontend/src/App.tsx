import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import './App.css'
import productImage from './assets/product-1.jpg'

type ProductBid = {
  id: number
  amount: string
  created_at?: string
  user: {
    id: number
    name: string
  }
}

type Product = {
  id: number
  name: string
  description: string
  starting_price: string
  current_price: string
  status: 'pending' | 'active' | 'ended' | string
  started_at: string | null
  ends_at: string | null
  bids: ProductBid[]
  winner?: {
    id: number
    name: string
  } | null
}

/*
 * CURRENT USER
 * There is no login system in this assignment.
 * Olivia represents the current user.
 */
const CURRENT_USER_NAME = 'Olivia'

function App() {
  const [product, setProduct] = useState<Product | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')

  const [showAllBids, setShowAllBids] = useState(false)

  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const [bidError, setBidError] = useState('')

  /*
   * COUNTDOWN END TIME
   * This value is created from the first bid. Later bids NEVER change this value.
   */
  const countdownEndRef = useRef<number | null>(null)

  /*Prevent repeated fetch requests after countdown reaches 0.
   */
  const endingRef = useRef(false)

  // Fetch Product
  const API_URL = import.meta.env.VITE_API_URL
  const fetchProduct = async () => {
    try {
      const response = await axios.get<Product>(
        `${API_URL}/api/products/1`
      )

      const latestProduct = response.data

      setProduct(latestProduct)
      setError('')

      /*
       * If auction is active and local countdown
       * has not been initialized yet,
       * calculate it from backend started_at.
       */
      if (
        latestProduct.status === 'active' &&
        latestProduct.started_at &&
        countdownEndRef.current === null
      ) {
        countdownEndRef.current =
          new Date(latestProduct.started_at).getTime() +
          60_000
      }

      /*
       * If backend says ended,
       * stop countdown.
       */
      if (latestProduct.status === 'ended') {
        countdownEndRef.current = null
        setRemainingSeconds(0)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load product.')
    } finally {
      setLoading(false)
    }
  }

 useEffect(() => {
    fetchProduct()

    const timer = window.setInterval(() => {
      fetchProduct()
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  // Countdown
  useEffect(() => {
    if (
      product?.status !== 'active' ||
      countdownEndRef.current === null
    ) {
      return
    }

    const updateCountdown = () => {
      const endTime = countdownEndRef.current

      if (endTime === null) {
        return
      }

      const difference = Math.max(
        0,
        Math.ceil(
          (endTime - Date.now()) / 1000
        )
      )

      setRemainingSeconds(difference)

      /* 
       * Countdown reached zero.
       * Ask backend for the final auction state.
       */
      if (
        difference === 0 &&
        !endingRef.current
      ) {
        endingRef.current = true

        fetchProduct().finally(() => {
          endingRef.current = false
        })
      }
    }

    /*
     * Update immediately.
     */
    updateCountdown()

    /*
     * Update UI every 250ms.
     * This makes the displayed second more accurate.
     */
    const timer = window.setInterval(
      updateCountdown,
      250
    )

    return () => {
      window.clearInterval(timer)
    }
  }, [product?.status])

  // Loading
  
  if (loading) {
    return (
      <main className="loading-page">
        Loading...
      </main>
    )
  }

  // Error
  
  if (error || !product) {
    return (
      <main className="loading-page">
        {error || 'Product not found.'}
      </main>
    )
  }

  // Product Data

  const startingPrice = Number(
    product.starting_price
  )

  const currentBid = Number(
    product.current_price
  )

  const bids = product.bids ?? []

  const visibleBids = showAllBids
    ? bids
    : bids.slice(0, 3)

  // Auction Status
  const isBefore =
    product.status === 'pending'

  const isDuring =
    product.status === 'active'

  const isEnded =
    product.status === 'ended'

  // Current User's Bid
  const currentBidByYou = bids.find(
    (bid) =>
      bid.user.name.toLowerCase() ===
      CURRENT_USER_NAME.toLowerCase()
  )

  // Bid Amount

  const bidAmount = Number(amount)

  const isAmountEntered =
    amount.trim() !== ''

  const isAmountTooLow =
    isAmountEntered &&
    Number.isFinite(bidAmount) &&
    bidAmount <= currentBid

  // Increment Preview

  const bidIncrement =
    isAmountEntered &&
    Number.isFinite(bidAmount) &&
    bidAmount > currentBid
      ? bidAmount - currentBid
      : 0

  // BID BUTTON

  const isBidDisabled =
    isSubmitting ||
    isEnded ||
    !name.trim() ||
    !isAmountEntered ||
    !Number.isFinite(bidAmount) ||
    bidAmount <= currentBid

  // Countdown Format

  const minutes = Math.floor(
    remainingSeconds / 60
  )

  const seconds =
    remainingSeconds % 60

  const formattedMinutes =
    String(minutes).padStart(2, '0')

  const formattedSeconds =
    String(seconds).padStart(2, '0')

  // Place Bid
  const handleBid = async () => {
    const bidValue = Number(amount)

    setBidError('')

    /*
     * Frontend validation.
     */

    if (!name.trim()) {
      return
    }

    if (
      !amount.trim() ||
      !Number.isFinite(bidValue) ||
      bidValue <= 0
    ) {
      return
    }

    if (bidValue <= currentBid) {
      return
    }

    if (isEnded) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await axios.post(
      `${API_URL}/api/products/${product.id}/bids`,
        {
          name: name.trim(),
          amount: bidValue,
        }
      )

      const latestProduct: Product =
        response.data.product

      /*
       * FIRST BID
       * Only initialize the countdown here.
       */
      if (
        product.status === 'pending' &&
        latestProduct.status === 'active' &&
        latestProduct.started_at
      ) {
        countdownEndRef.current =
          new Date(
            latestProduct.started_at
          ).getTime() + 60_000

        setRemainingSeconds(60)
      }

      /*
        * LATER BID
        * DO NOT modify countdownEndRef.
       */

      /*
       * Immediately update UI with backend response.
       */
      setProduct(latestProduct)

      /*
       * Clear amount after successful bid.
       */
      setAmount('')
    } catch (error: any) {
      console.error(error)

      /*
       * Backend rejected the bid.
       */
      if (error.response?.status === 422) {
        setBidError(
          error.response?.data?.message ||
            'Unable to place bid.'
        )

        /*
         * Refresh product in case:
         * - auction just ended
         * - another bidder changed current price
         */
        await fetchProduct()
      } else {
        setBidError(
          'Something went wrong. Please try again.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  //Reset Bid
    // Reset Auction
  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the auction? All bids will be cleared.'
    )

    if (!confirmed) {
      return
    }

    try {
      setIsResetting(true)
      setBidError('')

      const response = await axios.post(
        `${API_URL}/api/products/${product.id}/reset`
      )

      const latestProduct: Product =
        response.data.product

      // Reset countdown
      countdownEndRef.current = null
      endingRef.current = false
      setRemainingSeconds(0)

      // Update product
      setProduct(latestProduct)

      // Clear form
      setAmount('')
      setName('')

      // Reset bid history
      setShowAllBids(false)

    } catch (error) {
      console.error(error)

      setBidError(
        'Failed to reset auction. Please try again.'
      )
    } finally {
      setIsResetting(false)
    }
  }

  // Winner

  const winner =
    product.winner ?? null

  const isWinner =
    !!winner &&
    winner.name.toLowerCase() ===
      CURRENT_USER_NAME.toLowerCase()

  // UI

  return (
    <main className="auction-page">
      <header className="auction-header">
        <div>
         <div className="product-info">
            <img
              src={productImage}
              alt={product.name}
              className="product-image"
            />

            <div>
              
              <h1>
                Product : {product.name}
              </h1>
            </div>
          </div>

          {/* COUNTDOWN */}

          <div className="countdown">

             {isBefore && (
              <span className="auction-badge waiting">
                Waiting for first user bid
              </span>
            )}
            {isDuring && (
              <div >
                {formattedMinutes}
                :
                {formattedSeconds}
              </div>
            )}

            {isEnded && (
                <span className="auction-badge ended">
                Auction Ended
              </span>
            )}

          </div>

        </div>

      </header>
      
      <section className="auction-status">

        <div className="status-list">

          <div
            className={`status-item-before ${
              isBefore ? 'active' : ''
            }`}
          >
            <span>
              Before
            </span>

            <strong>
              RM {startingPrice.toLocaleString()}
            </strong>
          </div>

          <div
            className={`status-item-before ${
              isDuring ? 'active' : ''
            }`}
          >
            <span>
              During
            </span>

            <strong>
              RM {currentBid.toLocaleString()}
            </strong>
          </div>

          <div
            className={`status-item ${
              isEnded ? 'active' : ''
            }`}
          >
            <span>
              End
            </span>

            <strong>
              {isEnded
                ? `RM ${currentBid.toLocaleString()}`
                : '—'
              }
            </strong>
          </div>

        </div>

        {isEnded && winner ? (

          <div className="winner-notification">

            <div className="winner-content">

              {isWinner ? (

                <>
                  <h2>
                    🏆 You are the winner!
                  </h2>

                  <p>
                    Winning bid:{' '}

                    <strong>
                      RM {currentBid.toLocaleString()}
                    </strong>
                  </p>
                </>

              ) : (

                <>
                  <h2>
                    🏆 Auction won by {winner.name}
                  </h2>

                  <p>
                    Winning bid:{' '}

                    <strong>
                      RM {currentBid.toLocaleString()}
                    </strong>
                  </p>
                </>

              )}

            </div>

          </div>

        ) : (

          <>

          <div className="bid-summary">

              <div className="summary-item">

                <span>
                  Current Bid
                </span>

                <strong>
                  RM {currentBid.toLocaleString()}
                </strong>

              </div>

              <div className="summary-item">

                <span>
                  Current Bid by You
                </span>

                <strong>
                  {currentBidByYou
                    ? `RM ${Number(
                        currentBidByYou.amount
                      ).toLocaleString()}`
                    : '—'
                  }
                </strong>

              </div>

            </div>

            <div className="bid-history">

              <div className="history-header">

                <span>
                  Bid History
                </span>

                <span>
                  {bids.length} bids
                </span>

              </div>

              {bids.length === 0 ? (

                <div className="empty-history">
                  No bids yet.
                </div>

              ) : (

                <>

                  <div className="history-table">

                    <div className="history-table-header">

                      <span>
                        Amount
                      </span>

                      <span>
                        Name
                      </span>

                      <span>
                        Increment
                      </span>

                    </div>

                    {visibleBids.map(
                      (bid, index) => {

                        /*
                         * bids are ordered highest first.
                         */

                        const previousAmount =
                          index < bids.length - 1
                            ? Number(
                                bids[index + 1].amount
                              )
                            : startingPrice

                        const historyIncrement =
                          Number(bid.amount) -
                          previousAmount

                        return (

                          <div
                            className="history-table-row"
                            key={bid.id}
                          >

                            <strong>
                              RM {Number(
                                bid.amount
                              ).toLocaleString()}
                            </strong>

                            <span>
                              {bid.user.name}
                            </span>

                            <span className="increment">
                              +
                              {historyIncrement.toLocaleString()}
                            </span>

                          </div>

                        )
                      }
                    )}

                  </div>

                  {bids.length > 3 && (

                    <button
                      className="load-more"
                      type="button"
                      onClick={() =>
                        setShowAllBids(
                          !showAllBids
                        )
                      }
                    >
                      {showAllBids
                        ? 'Show less'
                        : 'Load more'
                      }
                    </button>

                  )}

                </>

              )}

            </div>

          </>

        )}

      </section>

      {!isEnded && (

        <footer className="bid-action">

          <div >

            <input
              type="number"
              placeholder="Any Amount"
              min={currentBid + 0.01}
              step="0.01"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                )
              }
            />

        
          </div>

          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
          />

          <div className="increment-preview">
            +{bidIncrement.toLocaleString()}
          </div>

          <button
            type="button"
            onClick={handleBid}
            disabled={isBidDisabled}
          >
            {isSubmitting
              ? 'BIDDING...'
              : 'BID'
            }
          </button>

    {isAmountTooLow && (

              <div className="bid-error">
                Bid amount must be higher than RM{' '}
                {currentBid.toLocaleString()}.
              </div>

            )}

            {bidError && (

              <div className="bid-error">
                {bidError}
              </div>

            )}

        </footer> 
      )}

        {/* TESTING CONTROL */}

        <div className="reset-container">
          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting
              ? 'RESETTING...'
              : 'RESET AUCTION'
            }
          </button>
        </div>

     

    </main>
  )
}

export default App