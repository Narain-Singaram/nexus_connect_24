import React, { useEffect, useState, useMemo } from 'react';
import { db } from "../firebase";
import { Card, Grid, Container, Input, Checkbox, Dropdown, Button } from 'semantic-ui-react';
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import ModalComp from '../components/ModalComp';
import Spinner from '../components/Spinner';
import { Image } from 'primereact/image';
import { Code } from "@nextui-org/react";
import { Chip } from 'primereact/chip';
import { Edit } from 'iconsax-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


import { useTable, useGlobalFilter, useFilters, useSortBy } from 'react-table';

const admins = [
    { name: 'Admin 1', code: 'admin1code' },
    { name: 'Admin 2', code: 'admin2code' },
    // Add more admins as needed
];

const Home = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [adminMode, setAdminMode] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [businessTypes, setBusinessTypes] = useState([]);
    const [selectedBusinessTypes, setSelectedBusinessTypes] = useState([]);
    const [industrySectors, setIndustrySectors] = useState([]);
    const [selectedIndustrySectors, setSelectedIndustrySectors] = useState([]);
    const [sortOption, setSortOption] = useState('');
    const [selectedFields, setSelectedFields] = useState([]);
    const [tableView, setTableView] = useState(false); // Added state for view toggle
    const navigate = useNavigate();

    useEffect(() => {
        const isAdminModeLocalStorage = localStorage.getItem('adminMode') === 'true';
        const selectedAdminLocalStorage = localStorage.getItem('selectedAdmin') || '';
        const secretCodeLocalStorage = localStorage.getItem('secretCode') || '';

        setAdminMode(isAdminModeLocalStorage);
        setSelectedAdmin(selectedAdminLocalStorage);
        setSecretCode(secretCodeLocalStorage);

        if (isAdminModeLocalStorage && selectedAdminLocalStorage && secretCodeLocalStorage) {
            validateAdminMode(selectedAdminLocalStorage, secretCodeLocalStorage);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
            let list = [];
            let businessTypesSet = new Set();
            let industrySectorsSet = new Set();
            snapshot.docs.forEach((doc) => {
                const userData = { id: doc.id, ...doc.data() };
                userData.tags = userData.tags ? userData.tags.split(',').map(tag => tag.trim()) : [];
                userData.timestamp = userData.timestamp.toDate().toLocaleString(); // Convert Firestore timestamp to JavaScript Date object
                businessTypesSet.add(userData.businessType);
                industrySectorsSet.add(userData.industrySector);
                list.push(userData);
            });
            setUsers(list);
            setFilteredUsers(list);
            setBusinessTypes([...businessTypesSet]);
            setIndustrySectors([...industrySectorsSet]);
            setLoading(false);
        }, (error) => {
            console.log(error);
        });

        return () => {
            unsub();
        };
    }, []);

    const handleModal = (item) => {
        setOpen(true);
        setUser(item);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure to delete this user?")) {
            try {
                setOpen(false);
                await deleteDoc(doc(db, "users", id));
                setUsers(users.filter((user) => user.id !== id));
                setFilteredUsers(filteredUsers.filter((user) => user.id !== id));
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleAdminModeChange = (event, data) => {
        const isChecked = data.checked;
        setAdminMode(isChecked);
        setSelectedAdmin('');
        setSecretCode('');
        localStorage.setItem('adminMode', isChecked);
    };

    const handleAdminSelectChange = (event, data) => {
        const selectedAdminValue = data.value;
        setSelectedAdmin(selectedAdminValue);
        localStorage.setItem('selectedAdmin', selectedAdminValue);
    };

    const handleSecretCodeChange = (event) => {
        const secretCodeValue = event.target.value;
        setSecretCode(secretCodeValue);
        localStorage.setItem('secretCode', secretCodeValue);
    };

    const validateAdminMode = (adminName, code) => {
        const admin = admins.find(admin => admin.name === adminName);
        return admin && admin.code === code;
    };

    const isAdminModeValid = () => {
        return validateAdminMode(selectedAdmin, secretCode);
    };

    const handleSuccessAlert = () => {
        alert('Success! You are now in admin mode.');
    };

    const handleSearchChange = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        setSearchTerm(searchTerm);
        filterUsers(searchTerm, selectedBusinessTypes, selectedIndustrySectors, sortOption);
    };

    const handleBusinessTypeChange = (event, data) => {
        const selectedTypes = data.value;
        setSelectedBusinessTypes(selectedTypes);
        filterUsers(searchTerm, selectedTypes, selectedIndustrySectors, sortOption);
    };

    const handleIndustrySectorChange = (event, data) => {
        const selectedSectors = data.value;
        setSelectedIndustrySectors(selectedSectors);
        filterUsers(searchTerm, selectedBusinessTypes, selectedSectors, sortOption);
    };

    const handleSortChange = (event, data) => {
        const selectedSortOption = data.value;
        setSortOption(selectedSortOption);
        filterUsers(searchTerm, selectedBusinessTypes, selectedIndustrySectors, selectedSortOption);
    };

    const filterUsers = (searchTerm, selectedBusinessTypes, selectedIndustrySectors, sortOption) => {
        let filtered = users.filter(user => {
            const matchesSearchTerm = user.name.toLowerCase().includes(searchTerm) ||
                user.info.toLowerCase().includes(searchTerm) ||
                user.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            const matchesBusinessType = selectedBusinessTypes.length === 0 || selectedBusinessTypes.includes(user.businessType);

            const matchesIndustrySector = selectedIndustrySectors.length === 0 || selectedIndustrySectors.includes(user.industrySector);

            return matchesSearchTerm && matchesBusinessType && matchesIndustrySector;
        });

        switch (sortOption) {
            case 'organizationSizeAsc':
                filtered.sort((a, b) => a.organizationSize - b.organizationSize);
                break;
            case 'organizationSizeDesc':
                filtered.sort((a, b) => b.organizationSize - a.organizationSize);
                break;
            case 'timestampAsc':
                filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'timestampDesc':
                filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'nameAsc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                break;
        }

        setFilteredUsers(filtered);
    };

    const exportData = () => {
        const exportData = filteredUsers.map(user => ({
            Name: user.name,
            BusinessType: user.businessType,
            Info: user.info,
            IndustrySector: user.industrySector,
            OrganizationSize: user.organizationSize,
            Timestamp: user.timestamp,
            Tags: user.tags.join(', ')
        }));

        const jsonExport = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const tableColumn = selectedFields.length > 0 ? selectedFields : ["Name", "BusinessType", "Info", "IndustrySector", "OrganizationSize", "Timestamp", "Tags"];
        const tableRows = [];

        filteredUsers.forEach(user => {
            const userData = tableColumn.map(field => user[field]);
            tableRows.push(userData);
        });

        autoTable(doc, { head: [tableColumn], body: tableRows });
        doc.save("report.pdf");
    };

    const columns = useMemo(
        () => [
            { Header: 'Name', accessor: 'name' },
            { Header: 'Business Type', accessor: 'businessType' },
            { Header: 'Info', accessor: 'info' },
            { Header: 'Industry Sector', accessor: 'industrySector' },
            { Header: 'Organization Size', accessor: 'organizationSize' },
            { Header: 'Timestamp', accessor: 'timestamp' },
            { Header: 'Tags', accessor: 'tags' }
        ],
        []
    );

    const data = useMemo(() => filteredUsers, [filteredUsers]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        setGlobalFilter
    } = useTable({ columns, data }, useGlobalFilter, useFilters, useSortBy);

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className=''>
            <div>
                <div style={{ marginBottom: '20px' }}>
                    <Checkbox
                        className='!p-4 !bg-slate-100 !rounded-3xl !m-4 !font-bold'
                        label='Admin Mode'
                        checked={adminMode}
                        onChange={handleAdminModeChange}
                    />
                    <br></br>
                    {adminMode && (
                        <div className='mb-6 mt-2'>
                            <Dropdown
                                className="!dropdown !rounded-full"
                                placeholder='Select admin...'
                                selection
                                options={admins.map(admin => ({ key: admin.name, text: admin.name, value: admin.name }))}
                                onChange={handleAdminSelectChange}
                                value={selectedAdmin}
                            />
                            <input
                                className='input input-bordered bg-white'
                                placeholder='Enter secret code...'
                                type='password'
                                value={secretCode}
                                onChange={handleSecretCodeChange}
                            />
                            <button
                                className='btn btn-primary'
                                onClick={() => {
                                    if (isAdminModeValid()) {
                                        handleSuccessAlert();
                                    } else {
                                        alert('Invalid admin credentials.');
                                    }
                                }}
                            > Go
                            </button>
                        </div>
                    )}
                    <input
  placeholder="Search..." className="input py-3 px-4 mx-auto max-w-md bg-gray-100 border-transparent rounded-xl text-sm dark:border-transparent dark:text-gray-400 dark:focus:ring-gray-600 transition-transform duration-300 transform hover:translate-y-0.5" value={searchTerm} onChange={handleSearchChange}  ></input>
  <br></br>
                    <Dropdown
                        placeholder='Filter by business type...'
                        className=''
                        multiple
                        selection
                        options={businessTypes.map(type => ({ key: type, text: type, value: type }))}
                        onChange={handleBusinessTypeChange}
                        value={selectedBusinessTypes}
                        style={{ marginTop: '10px' }}
                    />
                    <Dropdown
                        placeholder='Filter by industry sector...'
                        multiple
                        selection
                        options={industrySectors.map(sector => ({ key: sector, text: sector, value: sector }))}
                        onChange={handleIndustrySectorChange}
                        value={selectedIndustrySectors}
                        style={{ marginTop: '10px' }}
                    />

                    <Dropdown
                        placeholder='Sort by...'
                        selection
                        options={[
                            { key: 'organizationSizeAsc', text: 'Organization Size (Ascending)', value: 'organizationSizeAsc' },
                            { key: 'organizationSizeDesc', text: 'Organization Size (Descending)', value: 'organizationSizeDesc' },
                            { key: 'timestampAsc', text: 'Most Recent', value: 'timestampDesc' },
                            { key: 'timestampDesc', text: 'Oldest', value: 'timestampAsc' },
                            { key: 'nameAsc', text: 'Name (A-Z)', value: 'nameAsc' },
                            { key: 'nameDesc', text: 'Name (Z-A)', value: 'nameDesc' }
                        ]}
                        onChange={handleSortChange}
                        value={sortOption}
                        style={{ marginTop: '10px' }}
                    />
                    <Dropdown
                        placeholder='Select fields for report...'
                        multiple
                        selection
                        options={[
                            { key: 'name', text: 'Name', value: 'name' },
                            { key: 'businessType', text: 'Business Type', value: 'businessType' },
                            { key: 'info', text: 'Info', value: 'info' },
                            { key: 'industrySector', text: 'Industry Sector', value: 'industrySector' },
                            { key: 'organizationSize', text: 'Organization Size', value: 'organizationSize' },
                            { key: 'timestamp', text: 'Timestamp', value: 'timestamp' },
                            { key: 'tags', text: 'Tags', value: 'tags' }
                        ]}
                        onChange={(e, { value }) => setSelectedFields(value)}
                        value={selectedFields}
                        style={{ marginTop: '10px' }}
                    />
                    <button
                        style={{ marginLeft: '10px' }}
                        onClick={generatePDF}
                        className='py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none'
                    >
                        Generate PDF
                    </button>
                    
                    <button className='py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600  text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none' onClick={exportData}>
                        Export as JSON
                    </button>
                    
                    <button
                        style={{ marginLefzt: '10px' }}
                        onClick={() => setTableView(!tableView)}
                        className='py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none'
                    >
                        {tableView ? 'Card View' : 'Table View'}
                    </button>   
                    <br />
                </div>
                {tableView ? (
                    <table {...getTableProps()} style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map(column => (
                                        <th {...column.getHeaderProps(column.getSortByToggleProps())} style={{ border: '1px solid black', padding: '10px' }}>
                                            {column.render('Header')}
                                            <span>
                                                {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {rows.map(row => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => (
                                            <td {...cell.getCellProps()} style={{ border: '1px solid black', padding: '10px' }}>
                                                {cell.render('Cell')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 m-8 rounded-2xl'>
  {filteredUsers.map((item) => (
<div key={item.id}>
<section className="max-w-sm rounded-2xl overflow-hidden shadow-lg">
  <img className="w-full h-56" src={item.img} alt="Sunset in the mountains" />
  <div className="px-6 py-4">
    <span className='inline-block text-red-600'>{item.businessType}</span>
    <div className="font-bold text-xl mb-2">{item.name}</div>
    <p className="text-gray-700 ">
      {item.info}
    </p>
    <p className="text-sm text-gray-500">
              <span className="font-semibold">Industry Sector:</span> {item.industrySector}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Organization Size:</span> {item.organizationSize}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Timestamp:</span> {item.timestamp}
            </p>
  </div>
  <div className="px-6 pt-4 pb-2">
    {item.tags.map((tag, index) => (
        <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
            {tag}
        </span>
     ))}
  </div>
  <div class="mt-auto flex border-t border-gray-200 divide-x divide-gray-200 dark:border-neutral-700 dark:divide-neutral-700">
        <span class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-es-xl bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"onClick={() => handleModal(item)} loading={loading} href="#">
          View
        </span>
        {adminMode && isAdminModeValid() && (
        <span class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-ee-xl bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800" onClick={() => navigate(`/update/${item.id}`)} href="#">
          Update
        </span>
        )}
        {adminMode && isAdminModeValid() && (
        <span class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-ee-xl bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800" onClick={() => handleDelete(item.id)} href="#">
          Delete
        </span>
        )}
      </div>
      {open && (
        <ModalComp open={open} setOpen={setOpen} handleDelete={handleDelete} {...user} />
    )}

</section>
    </div>

  ))}
  </div>
                    
                )}

            </div>
        </div>
    );
};

export default Home;


<script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>
