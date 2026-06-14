import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { Reminder, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandlers';
import { Calendar, Clock, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReminderSystemProps {
    reminders: Reminder[];
    loading: boolean;
}

export const ReminderSystem: React.FC<ReminderSystemProps> = ({ reminders, loading }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newType, setNewType] = useState<'filing' | 'court_date' | 'other'>('filing');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        const path = 'reminders';
        try {
            await addDoc(collection(db, path), {
                userId: auth.currentUser.uid,
                title: newTitle,
                description: newDesc,
                date: Timestamp.fromDate(new Date(newDate)),
                type: newType,
                createdAt: serverTimestamp()
            });
            setNewTitle('');
            setNewDesc('');
            setNewDate('');
            setIsAdding(false);
        } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, path);
        }
    };

    const handleDelete = async (id: string) => {
        const path = `reminders/${id}`;
        try {
            await deleteDoc(doc(db, 'reminders', id));
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, path);
        }
    };

    if (!auth.currentUser) return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-12 px-4 pb-24">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-blue-500" size={24} />
                    Critical Deadlines
                </h3>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-gray-500 text-center py-8">Syncing with secure vault...</div>
                ) : reminders.length === 0 ? (
                    <div className="text-gray-500 text-center py-12 border border-dashed border-gray-800 rounded-2xl">
                        No upcoming deadlines detected.
                    </div>
                ) : (
                    <AnimatePresence>
                        {reminders.map((reminder) => (
                            <motion.div 
                                key={reminder.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex justify-between items-start group hover:border-white/10 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                                            reminder.type === 'filing' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                            reminder.type === 'court_date' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                        }`}>
                                            {reminder.type.replace('_', ' ')}
                                        </span>
                                        <span className="text-gray-500 text-xs flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(reminder.date.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-bold mb-1">{reminder.title}</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">{reminder.description}</p>
                                </div>
                                <button 
                                    onClick={() => handleDelete(reminder.id!)}
                                    className="p-2 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-white tracking-tight">Set Reminder</h3>
                                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Event Title</label>
                                    <input 
                                        autoFocus
                                        required
                                        type="text" 
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="e.g. Motion for Discovery Filing"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Category</label>
                                    <select 
                                        value={newType}
                                        onChange={e => setNewType(e.target.value as any)}
                                        className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="filing">Filing Deadline</option>
                                        <option value="court_date">Court Date</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Due Date</label>
                                    <input 
                                        required
                                        type="datetime-local" 
                                        value={newDate}
                                        onChange={e => setNewDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Details</label>
                                    <textarea 
                                        value={newDesc}
                                        onChange={e => setNewDesc(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none min-h-[100px]"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                                >
                                    Log Deadline
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
