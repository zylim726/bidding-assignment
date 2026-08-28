import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import App from './App'

vi.mock('axios')

const mockedAxios = vi.mocked(axios)

const pendingProduct = {
  id: 1,
  name: 'MacBook Pro',
  description: 'Apple MacBook Pro',
  starting_price: '100',
  current_price: '100',
  status: 'pending',
  started_at: null,
  ends_at: null,
  bids: [],
  winner: null,
}

const activeProduct = {
  id: 1,
  name: 'MacBook Pro',
  description: 'Apple MacBook Pro',
  starting_price: '100',
  current_price: '150',
  status: 'active',
  started_at: '2026-08-28T02:00:00.000Z',
  ends_at: '2026-08-28T02:01:00.000Z',
  bids: [
    {
      id: 2,
      amount: '150',
      created_at: '2026-08-28T02:00:20.000Z',
      user: {
        id: 2,
        name: 'Alex',
      },
    },
    {
      id: 1,
      amount: '120',
      created_at: '2026-08-28T02:00:10.000Z',
      user: {
        id: 1,
        name: 'Olivia',
      },
    },
  ],
  winner: null,
}

const endedProduct = {
  id: 1,
  name: 'MacBook Pro',
  description: 'Apple MacBook Pro',
  starting_price: '100',
  current_price: '200',
  status: 'ended',
  started_at: '2026-08-28T02:00:00.000Z',
  ends_at: '2026-08-28T02:01:00.000Z',
  bids: [
    {
      id: 1,
      amount: '200',
      created_at: '2026-08-28T02:00:30.000Z',
      user: {
        id: 1,
        name: 'Olivia',
      },
    },
  ],
  winner: {
    id: 1,
    name: 'Olivia',
  },
}

describe('Bidding App', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedAxios.get.mockResolvedValue({
      data: pendingProduct,
    })
  })

  it('displays the product when loaded', async () => {
    render(<App />)

    expect(
      await screen.findByText('Product : MacBook Pro')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Waiting for first user bid')
    ).toBeInTheDocument()
  })

  it('shows the current bid and bid history', async () => {
    mockedAxios.get.mockResolvedValue({
      data: activeProduct,
    })

    render(<App />)

    await screen.findByText('Product : MacBook Pro')

    expect(
    screen.getAllByText('RM 150').length
    ).toBeGreaterThan(0)

    expect(
      screen.getByText('Alex')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Olivia')
    ).toBeInTheDocument()
  })

  it('disables the bid button when name and amount are empty', async () => {
    render(<App />)

    const button = await screen.findByRole('button', {
      name: 'BID',
    })

    expect(button).toBeDisabled()
  })

  it('disables the bid button when bid is not higher than current price', async () => {
    mockedAxios.get.mockResolvedValue({
      data: activeProduct,
    })

    render(<App />)

    const amountInput =
      await screen.findByPlaceholderText('Any Amount')

    const nameInput =
      screen.getByPlaceholderText('Name')

    const button =
      screen.getByRole('button', {
        name: 'BID',
      })

    fireEvent.change(nameInput, {
      target: {
        value: 'Olivia',
      },
    })

    fireEvent.change(amountInput, {
      target: {
        value: '150',
      },
    })

    expect(button).toBeDisabled()

    expect(
      screen.getByText(
        'Bid amount must be higher than RM 150.'
      )
    ).toBeInTheDocument()
  })

  it('enables the bid button for a valid bid', async () => {
    mockedAxios.get.mockResolvedValue({
      data: activeProduct,
    })

    render(<App />)

    const amountInput =
      await screen.findByPlaceholderText('Any Amount')

    const nameInput =
      screen.getByPlaceholderText('Name')

    const button =
      screen.getByRole('button', {
        name: 'BID',
      })

    fireEvent.change(nameInput, {
      target: {
        value: 'Olivia',
      },
    })

    fireEvent.change(amountInput, {
      target: {
        value: '200',
      },
    })

    expect(button).toBeEnabled()
  })

  it('submits a valid bid', async () => {
    mockedAxios.get.mockResolvedValue({
      data: activeProduct,
    })

    mockedAxios.post.mockResolvedValue({
      data: {
        message: 'Bid placed successfully.',
        product: {
          ...activeProduct,
          current_price: '200',
          bids: [
            {
              id: 3,
              amount: '200',
              user: {
                id: 1,
                name: 'Olivia',
              },
            },
            ...activeProduct.bids,
          ],
        },
      },
    })

    render(<App />)

    const amountInput =
      await screen.findByPlaceholderText('Any Amount')

    const nameInput =
      screen.getByPlaceholderText('Name')

    const button =
      screen.getByRole('button', {
        name: 'BID',
      })

    fireEvent.change(nameInput, {
      target: {
        value: 'Olivia',
      },
    })

    fireEvent.change(amountInput, {
      target: {
        value: '200',
      },
    })

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/products/1/bids',
        {
          name: 'Olivia',
          amount: 200,
        }
      )
    })
  })

  it('displays the winner when the auction has ended', async () => {
    mockedAxios.get.mockResolvedValue({
      data: endedProduct,
    })

    render(<App />)

    expect(
      await screen.findByText('🏆 You are the winner!')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Winning bid:')
    ).toBeInTheDocument()

    expect(
        screen.getAllByText('RM 200').length
    ).toBeGreaterThan(0)
  })
})