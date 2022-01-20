/* theme */
let darkMode = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) || false

// to-do: remember theme value, especially if we are going to have multiple pages
function updateTheme() {
    document.body.dataset.theme = (darkMode ? "dark" : "light")
    if (document.querySelector("#theme-switch").checked !== darkMode) document.querySelector("#theme-switch").checked = darkMode
}
updateTheme()

document.querySelector("#theme-switch").addEventListener("change", (e) => {
    darkMode = e.target.checked
    updateTheme()
})

/* members */
function getAccountLink(account) {
    if (account.type === "steam") return `https://steamcommunity.com/profiles/${account.id}`
    if (account.type === "twitter") return `https://twitter.com/${account.name}`
    if (account.type === "github") return `https://github.com/${account.name}`
    if (account.type === "spotify") return `https://open.spotify.com/user/${account.id}`
    return null
}

function processMarkdown(str) {
    return str
        // Escape HTML
        .replace(/&/g, "&amp;")
        // TODO: When these fields become user controllable, this needs to be fixed
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        // Markdown processing
        .replace(/&lt;(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)*?)&gt;/g, "<a href='$1'>$1</a>")
        .replace(/^> (.*$)/g, "<blockquote>$1</blockquote>")
        .replace(/\*\*(.*)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*)\*/g, "<i>$1</i>")
        .replace(/\\n/g, "<br/>")
}

function getAverageColor(image) {
    const context = document.createElement("canvas").getContext("2d")
    context.imageSmoothingEnabled = true
    context.drawImage(
        image, 0, 0, 1, 1
    )
    return `rgb(${context.getImageData(
        0, 0, 1, 1
    ).data.slice(0, 3).join(", ")})`
}

const flagLogos = {
    HOUSE_BRILLIANCE: "assets/icons/badges/h_brilliance.svg",
    HOUSE_BALANCE: "assets/icons/badges/h_balance.svg",
    HOUSE_BRAVERY: "assets/icons/badges/h_bravery.svg",
    EARLY_VERIFIED_BOT_DEVELOPER: "assets/icons/badges/early_bot_developer.svg"
}

let showcasedProfiles

const members = document.getElementById("members")

function updateMembers() {
    if (document.hasFocus() && !showcasedProfiles) {
        // Profile showcases
        showcasedProfiles = "pending..."
        fetch("https://api.testausserveri.fi/v1/discord/memberInfo?role=839072621060423771")
            .then((res) => res.json())
            .catch((e) => console.error(e))
            .then((data) => {
                // TODO: Why is this like this?
                // eslint-disable-next-line eqeqeq
                if (JSON.stringify(showcasedProfiles) == JSON.stringify(data.members)) return
                const column = "<div class='member-showcase cards'></div>"
                members.innerHTML = `${column}${column}${column}`
                showcasedProfiles = data.members
                let cards = []
                for (const member of data.members) {
                    // Main element
                    const card = document.createElement("div")
                    card.className = "card"
                    // Banner
                    let banner
                    if (member.banner) {
                        banner = document.createElement("img")
                        banner.className = "banner"
                        banner.src = `${member.banner}?size=600`
                    } else {
                        banner = document.createElement("div")
                        banner.className = "banner"
                    }
                    card.appendChild(banner)
                    // Profile picture
                    const profilePicture = document.createElement("img")
                    profilePicture.className = "profile-picture"
                    // Set banner color, if not present
                    profilePicture.onload = () => {
                        banner.style.backgroundColor = member.color ?? getAverageColor(profilePicture)
                    }
                    profilePicture.crossOrigin = "Anonymous"
                    profilePicture.src = member.avatar
                    card.appendChild(profilePicture)
                    // Flags
                    const flags = document.createElement("ul")
                    flags.className = "flags"
                    for (const flag of member.flags) {
                        if (flagLogos[flag] !== undefined) {
                            const item = document.createElement("li")
                            const img = document.createElement("img")
                            img.src = flagLogos[flag]
                            item.appendChild(img)
                            flags.appendChild(item)
                        } else {
                            console.error("Unknown member flag", flag)
                        }
                    }
                    card.appendChild(flags)
                    // Display-name
                    const displayName = document.createElement("p")
                    displayName.className = "displayname"
                    displayName.innerText = member.displayName
                    card.appendChild(displayName)
                    // Account name
                    const name = document.createElement("p")
                    name.className = "name"
                    name.innerText = `${member.name}#${member.discriminator}`
                    card.appendChild(name)
                    // Status
                    const customStatusData = member.presence.filter((item) => item.type === "CUSTOM")[0]
                    const status = document.createElement("p")
                    status.className = "status"
                    if (customStatusData !== undefined) {
                        const { emoji } = customStatusData
                        if (emoji && emoji.url) {
                            const img = document.createElement("img")
                            img.src = emoji.url
                            img.alt = emoji.name
                            status.appendChild(img)
                        }
                        status.appendChild(document.createTextNode(customStatusData.state))
                    } else {
                        status.innerText = " "
                    }
                    card.appendChild(status)
                    // Spacer
                    const line = document.createElement("div")
                    line.className = "line"
                    card.appendChild(line)
                    // Bio
                    const bio = document.createElement("p")
                    bio.className = "about"
                    bio.innerHTML = member.bio ? processMarkdown(member.bio) : ""
                    card.appendChild(bio)
                    // Title
                    const title = document.createElement("p")
                    title.className = "activity"
                    title.innerText = "TILA"
                    // Activities
                    const activities = document.createElement("ul")
                    activities.className = "activities"
                    for (const activity of member.presence.filter((item) => item.type !== "CUSTOM")) {
                        const item = document.createElement("li")
                        // Image combo
                        let largeImage
                        if (activity.assets.largeImage) {
                            largeImage = document.createElement("img")
                            largeImage.className = "largeImage"
                            largeImage.src = activity.assets.largeImage
                        } else {
                            largeImage = document.createElement("div")
                            largeImage.className = "largeImage"
                        }
                        let smallImage
                        if (activity.name === "Spotify" && activity.type === "LISTENING") {
                            smallImage = document.createElement("img")
                            smallImage.className = "smallImage"
                            smallImage.src = "assets/icons/accounts/spotify.svg"
                            smallImage.style.filter = "var(--logo-filter)"
                        } else if (activity.assets.smallImage) {
                            smallImage = document.createElement("img")
                            smallImage.className = "smallImage"
                            smallImage.src = activity.assets.smallImage
                        } else {
                            smallImage = document.createElement("div")
                            smallImage.className = "smallImage"
                        }
                        largeImage.alt = activity.assets.largeImageText ?? ""
                        smallImage.alt = activity.assets.smallImageText ?? ""
                        item.appendChild(largeImage)
                        item.appendChild(smallImage)
                        // Name
                        const activityName = document.createElement("p")
                        activityName.className = "name"
                        activityName.innerText = activity.name
                        item.appendChild(activityName)
                        // Details
                        const text = document.createElement("p")
                        text.className = "text"
                        text.innerText = `${activity.details ?? ""}\n${activity.state ?? ""}`
                        item.appendChild(text)
                        activities.appendChild(item)
                    }
                    if (activities.children.length !== 0) {
                        card.appendChild(title)
                        card.appendChild(activities)
                    }
                    // Connected accounts
                    const accounts = document.createElement("ul")
                    accounts.className = "accounts"
                    for (const account of member.connectedAccounts) {
                        const item = document.createElement("li")
                        const link = document.createElement("a")
                        link.href = getAccountLink(account)
                        // Image
                        const image = document.createElement("img")
                        image.src = `assets/icons/accounts/${account.type}.svg`
                        image.className = "logo"
                        link.appendChild(image)
                        // Text
                        const text = document.createElement("p")
                        text.innerText = account.name
                        //link.appendChild(text)
                        item.appendChild(link)
                        accounts.appendChild(item)
                    }
                    if (accounts.children.length !== 0) {
                        // Spacer
                        const line2 = document.createElement("div")
                        line2.className = "line"
                        if (status.innerText !== " ") card.appendChild(line2)
                        card.appendChild(accounts)
                    }
                    cards.push(card)
                }
                const cards_length = cards.length
                const columns = new Array(3).fill(0).map((_, __, ar) => cards.splice(0, cards_length < 3 ? 1 : Math.floor(cards_length / ar.length)))
                console.log(columns)
                for (let i = 0; i < columns.length; i++) {
                    for (const element of columns[i]) {
                        members.children[i].appendChild(element)
                    }
                }
            })
    } else {
        // console.log('Tab not focused, not updating...');
    }
}
updateMembers()
window.addEventListener("focus", () => {
    setTimeout(updateMembers, 500)
})
setInterval(updateMembers, 5100)