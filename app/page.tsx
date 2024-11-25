import { Chat } from './components/Chat.js'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 bg-black">
      <div className="max-w-4xl mx-auto">
        <div className=" p-6">
          <Chat />
        </div>
      </div>
    </div>
  )
}