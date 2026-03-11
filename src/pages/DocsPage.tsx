import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import {
  Calculator, Settings, History, Package, UserPlus, LogIn, Printer, Palette,
  Image, Users, FileText, Sun, Moon, Save, Share2, MessageCircle
} from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 space-y-3">
      <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
        <Icon className="w-5 h-5" /> {title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </motion.div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{n}</span>
      <p>{children}</p>
    </div>
  );
}

export default function DocsPage() {
  const { isAdmin } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-1">Инструкция</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Подробное руководство по работе с системой MES COZY ART
          </p>
        </motion.div>

        {/* ===== USER SECTION ===== */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold">📘 Для пользователя</h2>
          <p className="text-sm text-muted-foreground">Раздел для партнёров и сотрудников</p>
        </div>

        <Section title="Регистрация и вход" icon={UserPlus}>
          <Step n={1}>
            Откройте приложение. Вы увидите страницу входа.
          </Step>
          <Step n={2}>
            Если у вас нет аккаунта — нажмите <strong>«Нет аккаунта? Зарегистрироваться»</strong>.
          </Step>
          <Step n={3}>
            Заполните форму: <strong>ФИО</strong> (обязательно), <strong>Телефон</strong> (обязательно), <strong>Telegram</strong> (необязательно), <strong>Email</strong> и <strong>Пароль</strong> (мин. 6 символов).
          </Step>
          <Step n={4}>
            После регистрации проверьте почту — нужно <strong>подтвердить email</strong>, перейдя по ссылке в письме.
          </Step>
          <Step n={5}>
            После подтверждения email <strong>администратор должен одобрить</strong> ваш аккаунт. До одобрения вход будет ограничен.
          </Step>
          <Step n={6}>
            После одобрения войдите с помощью email и пароля.
          </Step>
        </Section>

        <Section title="Калькулятор стоимости" icon={Calculator}>
          <p>Перейдите в раздел <strong>«Калькуляторы» → «Расчёт изделия»</strong> в боковом меню.</p>
          <Step n={1}>
            <strong>Выберите тип изделия</strong>: столешница, мойка, ступень-слэб, подоконник, фартук или лестница. Нажмите на карточку нужного продукта.
          </Step>
          <Step n={2}>
            <strong>Заполните параметры</strong>: длина, ширина, толщина, количество, цвет и дополнительные опции (в зависимости от типа изделия).
          </Step>
          <Step n={3}>
            Нажмите <strong>«Рассчитать»</strong>. Результат появится справа (или ниже на мобильном устройстве).
          </Step>
          <Step n={4}>
            В результате вы увидите: <strong>стоимость изделия</strong>, <strong>стоимость монтажа</strong> (если применимо), <strong>ориентировочный вес</strong>, разбивку по позициям.
          </Step>
        </Section>

        <Section title="Сохранение расчёта и создание лида" icon={Save}>
          <Step n={1}>
            После расчёта нажмите кнопку <strong>«Сохранить»</strong> (иконка дискеты).
          </Step>
          <Step n={2}>
            Введите <strong>название расчёта</strong>, <strong>имя клиента</strong>, телефон и email. При сохранении автоматически создаётся <strong>лид</strong> в разделе «Продажи».
          </Step>
          <Step n={3}>
            Расчёт сохранится в <strong>истории</strong>, а лид появится в разделе <strong>«Продажи»</strong> для дальнейшей работы.
          </Step>
        </Section>

        <Section title="Печать расчёта" icon={Printer}>
          <Step n={1}>
            В панели результата нажмите <strong>кнопку «Печать»</strong> (иконка принтера).
          </Step>
          <Step n={2}>
            Откроется окно с оформленным документом: шапка с логотипом компании, таблица расчёта, условия, контактные данные и палитра стандартных цветов (если включена администратором).
          </Step>
          <Step n={3}>
            Используйте стандартную функцию печати браузера для распечатки или сохранения в PDF.
          </Step>
          <p className="text-xs text-muted-foreground/70 italic">
            💡 Совет: если фотографии цветов не загрузились с первого раза, закройте окно печати и нажмите «Печать» повторно — изображения загрузятся из кеша.
          </p>
        </Section>

        <Section title="Отправка расчёта" icon={Share2}>
          <p>Расчёт можно отправить клиенту несколькими способами:</p>
          <Step n={1}>
            <strong>WhatsApp</strong> — нажмите «Поделиться» → WhatsApp. Текст расчёта будет отправлен в мессенджер.
          </Step>
          <Step n={2}>
            <strong>Telegram</strong> — аналогично, через кнопку «Поделиться» → Telegram.
          </Step>
          <Step n={3}>
            <strong>Email</strong> — через кнопку «Поделиться» → Email. Откроется почтовый клиент с заполненным текстом.
          </Step>
        </Section>

        <Section title="История расчётов" icon={History}>
          <Step n={1}>
            Перейдите в <strong>«Калькуляторы» → «История»</strong> в боковом меню.
          </Step>
          <Step n={2}>
            Вы увидите <strong>календарь</strong> с отмеченными датами, в которые были сделаны расчёты.
          </Step>
          <Step n={3}>
            Нажмите на дату, чтобы увидеть список расчётов за этот день. Каждый расчёт показывает: название, тип изделия, итоговую стоимость.
          </Step>
          <Step n={4}>
            Вы можете <strong>удалить</strong> ненужные расчёты из истории.
          </Step>
        </Section>

        <Section title="Калькулятор ящика" icon={Package}>
          <p>
            Расчёт ящика доступен как опция в калькуляторе изделий (флажок «Нужен транспортировочный ящик»), а также как отдельный инструмент на странице <strong>«Калькуляторы» → «Расчёт изделия»</strong> через прямую ссылку /box.
          </p>
        </Section>

        <Section title="Тёмная / Светлая тема" icon={Sun}>
          <p>
            Нажмите на иконку <strong>солнца/луны</strong> в нижней части бокового меню для переключения между тёмной и светлой темами. Настройка сохраняется автоматически.
          </p>
        </Section>
        </Section>

        {/* ===== ADMIN SECTION ===== */}
        {isAdmin && (
          <>
            <Separator className="my-8" />

            <div className="space-y-1">
              <h2 className="text-xl font-bold">🔧 Для администратора</h2>
              <p className="text-sm text-muted-foreground">Управление системой, ценами, пользователями и шаблонами</p>
            </div>

            <Section title="Панель администратора — обзор" icon={Settings}>
              <p>
                Перейдите на страницу <strong>«Админ»</strong> в навигации (видна только администраторам). Панель содержит вкладки:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Цены</strong> — управление ценами на изделия и услуги</li>
                <li><strong>Цвета</strong> — управление палитрой стандартных цветов</li>
                <li><strong>Иконки</strong> — иконки типов продуктов</li>
                <li><strong>Контакты</strong> — контактная информация компании</li>
                <li><strong>Пользователи</strong> — управление пользователями и доступом</li>
                <li><strong>Расчёты</strong> — просмотр всех расчётов пользователей</li>
                <li><strong>Шаблон печати</strong> — настройка внешнего вида печатного документа</li>
              </ul>
            </Section>

            <Section title="Управление ценами" icon={Calculator}>
              <Step n={1}>
                Откройте вкладку <strong>«Цены»</strong>. Здесь отображаются все ценовые параметры, сгруппированные по категориям.
              </Step>
              <Step n={2}>
                Для изменения цены нажмите на поле значения, введите новое число и нажмите <strong>«Сохранить»</strong>.
              </Step>
              <Step n={3}>
                Изменения <strong>вступают в силу мгновенно</strong> — все новые расчёты будут использовать обновлённые цены.
              </Step>
              <p className="text-xs text-muted-foreground/70 italic">
                ⚠️ Внимание: ранее сохранённые расчёты не пересчитываются. Они остаются с теми ценами, которые действовали на момент расчёта.
              </p>
            </Section>

            <Section title="Управление цветами" icon={Palette}>
              <Step n={1}>
                Откройте вкладку <strong>«Цвета»</strong>. Вы увидите список всех стандартных цветов.
              </Step>
              <Step n={2}>
                <strong>Добавить цвет:</strong> введите название нового цвета внизу и нажмите <strong>«Добавить»</strong>.
              </Step>
              <Step n={3}>
                <strong>Загрузить фото цвета:</strong> нажмите кнопку загрузки (иконка ↑) напротив цвета. Выберите изображение (макс. 2 МБ). Фото будет отображаться как миниатюра рядом с названием.
              </Step>
              <Step n={4}>
                <strong>Включить/выключить цвет:</strong> кнопка «Активен» / «Выкл» определяет, доступен ли цвет пользователям при расчёте.
              </Step>
              <Step n={5}>
                <strong>Показывать в печати:</strong> переключатель с иконкой принтера 🖨 определяет, будет ли этот цвет отображаться в палитре печатного документа.
              </Step>
              <Step n={6}>
                <strong>Удалить фото:</strong> нажмите кнопку с иконкой изображения (красная) для удаления фото.
              </Step>
              <Step n={7}>
                <strong>Удалить цвет:</strong> нажмите иконку корзины для полного удаления цвета.
              </Step>
            </Section>

            <Section title="Управление пользователями" icon={Users}>
              <Step n={1}>
                Откройте вкладку <strong>«Пользователи»</strong>. Вы увидите список всех зарегистрированных пользователей.
              </Step>
              <Step n={2}>
                <strong>Одобрить пользователя:</strong> новые пользователи после регистрации и подтверждения email ожидают одобрения. Нажмите переключатель <strong>«Одобрен»</strong>, чтобы предоставить доступ.
              </Step>
              <Step n={3}>
                <strong>Отозвать доступ:</strong> отключите переключатель «Одобрен» для блокировки пользователя.
              </Step>
              <p className="text-xs text-muted-foreground/70 italic">
                💡 Пользователь увидит сообщение об ожидании одобрения, если его аккаунт ещё не подтверждён администратором.
              </p>
            </Section>

            <Section title="Контактная информация" icon={MessageCircle}>
              <Step n={1}>
                Откройте вкладку <strong>«Контакты»</strong>.
              </Step>
              <Step n={2}>
                Здесь хранятся контактные данные компании, которые отображаются в печатных документах: телефон, email, адрес, сайт и др.
              </Step>
              <Step n={3}>
                Измените значение и нажмите <strong>«Сохранить»</strong>.
              </Step>
            </Section>

            <Section title="Шаблон печати" icon={FileText}>
              <p>Вкладка <strong>«Шаблон печати»</strong> позволяет полностью настроить внешний вид печатного документа расчёта:</p>

              <div className="space-y-3 mt-2">
                <div>
                  <p className="font-medium text-foreground">📎 Логотип</p>
                  <p>Загрузите логотип компании (PNG, JPG, SVG, до 2 МБ). Он будет отображаться в шапке документа и в навигации сайта.</p>
                </div>

                <div>
                  <p className="font-medium text-foreground">📝 Шапка и подвал</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li><strong>Название компании</strong> — заголовок в шапке документа</li>
                    <li><strong>Подзаголовок</strong> — текст под названием (например, «архитектурный бетон»)</li>
                    <li><strong>Подвал (левая/правая часть)</strong> — текст в нижней части документа. Каждая строка — отдельная строка в подвале.</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">🎨 Палитра цветов</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li><strong>Показывать палитру</strong> — переключатель для включения/отключения палитры в подвале документа</li>
                    <li><strong>Размеры фото</strong> — ширина и высота миниатюр цветов (в пикселях)</li>
                    <li><strong>Отступ</strong> — расстояние между миниатюрами</li>
                    <li><strong>Примечание</strong> — текст под палитрой (например, «Возможен подбор индивидуального цвета по каталогу RAL»)</li>
                  </ul>
                  <p className="text-xs italic mt-1">Какие именно цвета отображать — настраивается во вкладке «Цвета» (переключатель с иконкой принтера).</p>
                </div>

                <div>
                  <p className="font-medium text-foreground">📋 Условия</p>
                  <p>Список условий, отображаемых в документе. Каждая строка = отдельный пункт. Например:</p>
                  <ul className="list-disc pl-5 text-xs space-y-0.5">
                    <li>Кронштейн и монтаж приобретаются при необходимости</li>
                    <li>Доставка и услуги грузчиков — по тарифам партнёров</li>
                    <li>Гарантия: 1 год на изделие</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">👁 Предпросмотр</p>
                  <p>Нажмите <strong>«Предпросмотр шаблона»</strong> внизу страницы, чтобы увидеть, как будет выглядеть документ с текущими настройками.</p>
                </div>
              </div>
            </Section>

            <Section title="Просмотр всех расчётов" icon={History}>
              <Step n={1}>
                Откройте вкладку <strong>«Расчёты»</strong>.
              </Step>
              <Step n={2}>
                Здесь отображаются <strong>все расчёты всех пользователей</strong> в хронологическом порядке.
              </Step>
              <Step n={3}>
                Вы можете просматривать детали каждого расчёта и при необходимости удалять их.
              </Step>
            </Section>

            <Section title="Важные примечания" icon={Settings}>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Монтажные работы</strong> — в печатном документе автоматически указывается: «Монтажные работы оплачиваются в день завершения монтажных работ специалисту по монтажу».</li>
                <li><strong>Данные специалиста</strong> — в документе указываются ФИО, телефон, email и Telegram того сотрудника, который выполнил расчёт (берутся из профиля пользователя).</li>
                <li><strong>Изменение цен</strong> — влияет только на новые расчёты. Старые расчёты сохраняют свои значения.</li>
                <li><strong>Роли</strong> — в системе есть 2 роли: <strong>пользователь</strong> (расчёты, история, печать) и <strong>администратор</strong> (полное управление).</li>
              </ul>
            </Section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
