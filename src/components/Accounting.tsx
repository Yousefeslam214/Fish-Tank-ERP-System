import { User, Farm } from '../types';
import AccountingModule from './accounting/AccountingModule';

interface AccountingProps {
  user: User;
  selectedFarm: Farm | null;
  language?: 'en' | 'ar';
}

export default function Accounting({ user, selectedFarm, language = 'en' }: AccountingProps) {
  return <AccountingModule user={user} selectedFarm={selectedFarm} language={language} />;
}
