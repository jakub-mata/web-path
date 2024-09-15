window.addEventListener('DOMContentLoaded', () => {
    /*
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
    */
    const button = document.getElementById("send-button");
    button.setAttribute("onclick", "startHopping()")
})