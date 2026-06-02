import ContactList from '../components/chat/ContactList';
import './Contacts.css';

const Contacts = () => {
  return (
    <div className="contacts-page">
      <div className="contacts-container">
        <div className="contacts-header">
          <h1 className="contacts-title">聯絡人</h1>
          <p className="contacts-subtitle">選擇聯絡人開始對話</p>
        </div>
        
        <ContactList />
      </div>
    </div>
  );
};

export default Contacts;

