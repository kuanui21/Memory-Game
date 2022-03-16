const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

const view = {     //介面
  // 最初畫面，顯示牌的背面
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  // 牌的內容，把數字和花色放到陣列裡
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
        <p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>
      `
  },
  // 部分數字改為英文呈現
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // 展示洗牌過後的所有牌
  displayCards(indexes) {
    const rootElement = document.querySelector("#cards");
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('');
  },
  // 翻牌，如果是牌的背面，轉為正面，並顯示牌的內容
  // 如果是牌的正面，則轉為背面，移除內容
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
      } else {
        card.classList.add('back')
        card.innerHTML = null
      }
    })
  },
  // 配對成功的牌，新增 paired 標籤
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  // 顯示分數
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },
  // 顯示次數
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`;
  },
  // 產生動畫，新增 wrong 標籤
  // 監聽器綁定「動畫結束事件 (animationend)」，動畫跑完一輪，把 wrong 標籤拿掉
  // 要求在事件執行一次之後，就要卸載這個監聽器
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationed', event => event.target.classList.remove('wrong'), { once: true })
    })
  }, 
  // 遊戲結束畫面，新增一個 div 及 completed 標籤，放呈現的內容
  // 在 header 前面加上這個 div
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }

}

const model = {
  // 放翻開的兩張牌的內容
  revealedCards: [],

  // 檢查兩張牌數字是否相同，相等就回傳 true，反之則為 false
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0
}

const controller = {
  // 最初的狀態，等待翻第一張牌
  currentState: GAME_STATE.FirstCardAwaits,


  // 產生牌，洗好的牌放到各個位置，顯示牌的背面
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 確認狀態，派遣工作
  dispatchCardAction(card) {
    // 如果牌是正片，不做回應
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      // 當狀況為 等待翻第一張牌
      // 執行翻牌，並將翻開牌的內容存到 modal 中
      // 狀況接續至 等待翻第二張牌
      // break 為跳出該 case，用 return 則是跳出函式
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      // 當狀況為 等待翻第二張牌
      // 次數加一
      // 執行翻牌，並將翻開牌的內容存到 modal 中
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)

        // 如果兩張牌數字相同，狀況為 牌組配對成功
        // 分數加 10
        // 增加牌的標籤(改顏色)
        // modal 的暫存內容清除
        if (model.isRevealedCardsMatched()) {
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []

          // 如果成績為 260 分，狀況為 遊戲結束
          // 顯示遊戲結束畫面
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          // 狀況回到 等待翻第一張牌
          this.currentState = GAME_STATE.FirstCardAwaits
        }
        // 若牌不同，狀況為 牌組配對失敗
        // 產生動畫
        // 暫停一秒後，執行 resetCards 函式
        else {
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  // 重設牌的狀態，兩張牌翻回背面
  // modal 的暫存內容清除
  // 狀況回到 等待翻第一張牌
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

const utility = {    // 外掛函式庫
  // 洗牌，每張牌都和亂數位置的排交換
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

// 呼叫控制器的產生牌
controller.generateCards()

// 每張牌都裝上監聽器，點擊時，執行控制器派遣的函式
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})