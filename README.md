# Axios API Generator

   Я работаю с Vue3.js проектом, использующим для запросов к API Axios. 
   Работа с несистематизированным вызовом API через Axios имела следующие проблемы:
   - Повторное использование кода (пусть это и всего лишь вызов API)
   - Изменение заголовков, адресов и т.п для одного часто используемого API или для группы API 
потребует поиск использования данного API во всех файлах проекта. 
   - Если "Back" не ведёт список API, с простым вызовом API его и не будет.

   С помощью AAPIG можно с минимальными затратами усилий перевести простое использование Axios в
   систему API с легко обновляемым кодом вызовов API благодаря хранению информации о всём API и
   оборачиванию всех API функций в js объект.

   Помимо решения выше описанных проблем с помощью AAPIG возможно:
   
   - Использование валидации ответов на запросы к API вне Axios структуры.
   - Создание "справочников" для хранения редко обновляемой информации в localStorage.