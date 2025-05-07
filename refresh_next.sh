npm run build && ps aux | grep "next" | awk 'NR<=2{print $2}' | xargs kill
