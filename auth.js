// auth.js
document.addEventListener('DOMContentLoaded', () => {
    const userDisplay = document.getElementById('user-display');
    const logoutButtons = document.querySelectorAll('#logout-btn');

    auth.onAuthStateChanged(user => {
        const isLoginPage = window.location.pathname.endsWith('login.html');

        if (user) {
            // 使用者已登入
            if (isLoginPage) {
                window.location.replace('index.html');
            } else if (userDisplay) {
                const displayName = user.isAnonymous ? '訪客' : user.displayName || '使用者';
                userDisplay.textContent = `歡迎, ${displayName}`;
            }
        } else {
            // 使用者未登入
            if (!isLoginPage) {
                window.location.replace('login.html');
            }
        }
    });
    
    // 登出按鈕事件
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('User signed out.');
                window.location.replace('login.html');
            }).catch(error => {
                console.error('Sign out error', error);
            });
        });
    });

    // 登入頁面邏輯
    const googleLoginBtn = document.getElementById('google-login-btn');
    const anonymousLoginBtn = document.getElementById('anonymous-login-btn');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            auth.signInWithPopup(googleProvider)
                .then(result => {
                    console.log('Signed in with Google:', result.user);
                }).catch(error => {
                    console.error('Google sign-in error:', error);
                });
        });
    }

    if (anonymousLoginBtn) {
        anonymousLoginBtn.addEventListener('click', () => {
            auth.signInAnonymously()
                .then(result => {
                    console.log('Signed in anonymously:', result.user);
                }).catch(error => {
                    console.error('Anonymous sign-in error:', error);
                });
        });
    }
});