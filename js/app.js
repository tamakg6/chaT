// HTMLの要素を取得
const saveBtn = document.getElementById('save-btn');
const subjectInput = document.getElementById('subject');
const minutesInput = document.getElementById('minutes');

// ボタンクリック時の処理
saveBtn.addEventListener('click', () => {
    const subject = subjectInput.value;
    const minutes = minutesInput.value;

    if (subject === "" || minutes === "") {
        alert("入力してください！");
        return;
    }

    console.log(`保存データ: ${subject} を ${minutes} 分`);
    
    // 次のステップでここにFirebaseへの保存処理を書きます
    
    // 入力欄を空にする
    subjectInput.value = "";
    minutesInput.value = "";
});
